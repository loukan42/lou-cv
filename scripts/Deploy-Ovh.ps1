param([switch]$PrepareOnly)

$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $false
$deployRepo = Split-Path -Parent $PSScriptRoot
$deployId = [DateTime]::UtcNow.ToString('yyyyMMddTHHmmssZ')
$deployWorking = Join-Path $deployRepo '.ovh-deploy'
$deployDirectory = Join-Path $deployWorking $deployId
$deploySite = Join-Path $deployDirectory 'site'
$deployStatePath = Join-Path $deployWorking 'state.json'
$deployHostName = 'ftp.cluster129.hosting.ovh.net'
$deploySftp = (Get-Command sftp.exe).Source
$deployKeyscan = (Get-Command ssh-keyscan.exe).Source
$deploySsh = (Get-Command ssh.exe).Source
$deployGitSshDirectory = Join-Path $env:ProgramFiles 'Git/usr/bin'
if (Test-Path -LiteralPath (Join-Path $deployGitSshDirectory 'sftp.exe')) {
    $deploySftp = Join-Path $deployGitSshDirectory 'sftp.exe'
    $deployKeyscan = Join-Path $deployGitSshDirectory 'ssh-keyscan.exe'
    $deploySsh = Join-Path $deployGitSshDirectory 'ssh.exe'
}
$deployStage = ".cv-stage-$deployId"
$deployBackup = ".cv-backup-$deployId"

function Save-DeployState([string]$Status, [string]$Detail) {
    [ordered]@{
        status = $Status
        detail = $Detail
        updatedAt = [DateTime]::UtcNow.ToString('o')
        package = $deploySite
        remoteBackup = $deployBackup
        processId = $PID
    } | ConvertTo-Json | Set-Content -LiteralPath $deployStatePath -Encoding utf8
}

New-Item -ItemType Directory -Path $deploySite -Force | Out-Null
$deployTrackedFiles = & git -C $deployRepo ls-files -- dist
if ($LASTEXITCODE -ne 0) { throw 'Impossible de preparer les fichiers du site.' }
foreach ($deployFile in $deployTrackedFiles) {
    if ($deployFile -eq 'dist/CNAME') { continue }
    $deployRelative = $deployFile.Substring(5)
    $deployDestination = Join-Path $deploySite $deployRelative
    New-Item -ItemType Directory -Path (Split-Path -Parent $deployDestination) -Force | Out-Null
    Copy-Item -LiteralPath (Join-Path $deployRepo $deployFile) -Destination $deployDestination
}
# Include the OVH redirect configuration even before its first commit.
Copy-Item -LiteralPath (Join-Path $deployRepo 'dist/.htaccess') -Destination $deploySite -Force
$deployBytes = (Get-ChildItem -LiteralPath $deploySite -Recurse -File | Measure-Object Length -Sum).Sum
if ($deployBytes -gt 80MB) { throw 'Le site depasse la taille prevue pour cet hebergement.' }
if (-not (Test-Path -LiteralPath (Join-Path $deploySite 'index.html'))) { throw 'index.html est absent.' }
Save-DeployState 'prepared' "Site pret : $([math]::Round($deployBytes / 1MB, 2)) Mo."
Write-Host "Site OVH prepare : $([math]::Round($deployBytes / 1MB, 2)) Mo."
if ($PrepareOnly) { exit 0 }

try {
    $deployKnownHosts = Join-Path $deployWorking 'known_hosts'
    if (-not (Test-Path -LiteralPath $deployKnownHosts)) {
        $deployHostKeys = & $deployKeyscan -4 -T 15 -t ed25519,rsa $deployHostName 2>$null
        if (-not $deployHostKeys) { throw 'Impossible de recuperer la cle publique du serveur SFTP OVH.' }
        $deployHostKeys | Set-Content -LiteralPath $deployKnownHosts -Encoding ascii
    }

    $deployBatch = Join-Path $deployDirectory 'sftp-batch.txt'
    $deploySiteUnix = $deploySite.Replace('\', '/')
    @(
        "put -r `"$deploySiteUnix`" `"$deployStage`""
        "rename `"www`" `"$deployBackup`""
        "rename `"$deployStage`" `"www`""
        'bye'
    ) | Set-Content -LiteralPath $deployBatch -Encoding ascii

    Save-DeployState 'waiting_for_sftp' 'Saisir le mot de passe SFTP directement dans cette fenetre.'
    $Host.UI.RawUI.WindowTitle = 'CV vers OVH - connexion SFTP'
    Write-Host ''
    Write-Host 'Connexion au serveur OVH avec le compte louhusj.' -ForegroundColor Cyan
    Write-Host 'Saisis le mot de passe SFTP a la prochaine invite.'
    Write-Host 'La saisie reste masquee et le mot de passe ne sera pas enregistre.'
    Write-Host 'Le transfert et la sauvegarde du dossier www se feront ensuite automatiquement.'
    Write-Host ''

    # OpenSSH keeps the first value of an option. BatchMode=no must precede -b,
    # which otherwise forces noninteractive authentication.
    & $deploySftp -4 -S $deploySsh.Replace('\', '/') -o BatchMode=no -o "UserKnownHostsFile=$($deployKnownHosts.Replace('\', '/'))" -o StrictHostKeyChecking=yes -o ConnectTimeout=20 -o NumberOfPasswordPrompts=1 -b $deployBatch.Replace('\', '/') "louhusj@$deployHostName"
    if ($LASTEXITCODE -ne 0) { throw 'Le transfert SFTP a echoue. Les DNS ne doivent pas encore etre modifies.' }

    Save-DeployState 'uploaded' 'Fichiers transferes. Verification HTTPS directe du serveur OVH.'
    $deployResponse = & curl.exe --fail --silent --show-error --max-time 30 --resolve 'louhusson.com:443:51.91.236.255' 'https://louhusson.com/' 2>&1 | Out-String
    if ($LASTEXITCODE -ne 0 -or $deployResponse -notmatch 'Lou Husson') { throw 'Le serveur OVH ne renvoie pas encore le CV attendu en HTTPS.' }
    $deployRedirect = & curl.exe --silent --show-error --head --max-time 30 --resolve 'louhusson.com:80:51.91.236.255' 'http://louhusson.com/' 2>&1 | Out-String
    if ($LASTEXITCODE -ne 0 -or $deployRedirect -notmatch '(?im)^Location:\s*https://louhusson\.com/') { throw 'La redirection HTTPS reste a verifier.' }
    Save-DeployState 'ready_for_dns' 'CV servi par OVH en HTTPS et redirection HTTP verifiee. Basculer les DNS vers OVH.'
    Write-Host 'CV transfere sur OVH. HTTPS et redirection verifies. Le domaine peut maintenant basculer vers OVH.' -ForegroundColor Green
}
catch {
    Save-DeployState 'failed' $_.Exception.Message
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}
