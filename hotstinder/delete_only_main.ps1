# GitHub main 브랜치 삭제 PowerShell 스크립트
Write-Host "GitHub 원격 레포지토리에서 main 브랜치 삭제를 시작합니다" -ForegroundColor Green
Write-Host "----------------------------------------------------" -ForegroundColor Gray

# 사용자 확인
Write-Host "경고: 이 작업은 되돌릴 수 없으며, 원격 저장소의 main 브랜치가 삭제됩니다." -ForegroundColor Red
Write-Host "main 브랜치는 일반적으로 기본 브랜치이므로 삭제하면 저장소에 문제가 발생할 수 있습니다." -ForegroundColor Red
Write-Host "계속하기 전에 다른 브랜치를 만들고 기본 브랜치로 설정하는 것이 좋습니다." -ForegroundColor Yellow
$confirmation = Read-Host "정말로 main 브랜치를 삭제하시겠습니까? (Y/N)"
if ($confirmation -ne 'Y' -and $confirmation -ne 'y') {
    Write-Host "작업이 취소되었습니다." -ForegroundColor Cyan
    exit
}

# 원격 레포지토리 최신 정보로 업데이트
Write-Host "`n원격 저장소 정보 업데이트 중..." -ForegroundColor Cyan
git fetch origin

# 원격 브랜치 목록 가져오기
$branches = git branch -r | Where-Object { $_ -match "origin/main" }

# main 브랜치가 존재하는지 확인
if (-not $branches) {
    Write-Host "`nmain 브랜치가 존재하지 않습니다." -ForegroundColor Red
    exit
}

# 현재 기본 브랜치 확인
$defaultBranch = git symbolic-ref refs/remotes/origin/HEAD | ForEach-Object { $_.Split('/')[-1] }
if ($defaultBranch -eq "main") {
    Write-Host "`n경고: main은 현재 기본 브랜치입니다. 삭제하기 전에 다른 브랜치를 기본 브랜치로 설정해야 합니다." -ForegroundColor Red
    Write-Host "GitHub 저장소 설정에서 기본 브랜치를 변경한 후 이 스크립트를 다시 실행하세요." -ForegroundColor Yellow
    $overrideConfirmation = Read-Host "그래도 계속 진행하시겠습니까? (Y/N)"
    if ($overrideConfirmation -ne 'Y' -and $overrideConfirmation -ne 'y') {
        Write-Host "작업이 취소되었습니다." -ForegroundColor Cyan
        exit
    }
}

# 최종 확인
$finalConfirmation = Read-Host "`n마지막 경고: main 브랜치를 삭제하면 복구할 수 없습니다. 계속하시겠습니까? (Y/N)"
if ($finalConfirmation -ne 'Y' -and $finalConfirmation -ne 'y') {
    Write-Host "작업이 취소되었습니다." -ForegroundColor Cyan
    exit
}

Write-Host "`nmain 브랜치 삭제 시작..." -ForegroundColor Cyan
    
# 원격 브랜치 삭제
git push origin --delete main
    
# 삭제 성공 여부 확인
if ($LASTEXITCODE -eq 0) {
    Write-Host "성공적으로 삭제됨: main" -ForegroundColor Green
} else {
    Write-Host "삭제 실패: main" -ForegroundColor Red
    Write-Host "가능한 원인:" -ForegroundColor Yellow
    Write-Host "1. main이 보호된 브랜치입니다." -ForegroundColor Yellow
    Write-Host "2. main이 현재 기본 브랜치로 설정되어 있습니다." -ForegroundColor Yellow
    Write-Host "3. 원격 저장소에 대한 권한이 부족합니다." -ForegroundColor Yellow
}

Write-Host "`n----------------------------------------------------" -ForegroundColor Gray
Write-Host "작업 완료!" -ForegroundColor Green
Write-Host "`n남은 브랜치 확인:" -ForegroundColor Cyan
git branch -r 