# GitHub 원격 레포지토리에서 모든 브랜치 삭제 PowerShell 스크립트
Write-Host "GitHub 원격 레포지토리에서 모든 브랜치 삭제를 시작합니다" -ForegroundColor Green
Write-Host "----------------------------------------------------" -ForegroundColor Gray

# 사용자 확인
Write-Host "경고: 이 작업은 되돌릴 수 없으며, 모든 원격 브랜치가 삭제됩니다 (main 포함)." -ForegroundColor Yellow
$confirmation = Read-Host "계속하시겠습니까? (Y/N)"
if ($confirmation -ne 'Y' -and $confirmation -ne 'y') {
    Write-Host "작업이 취소되었습니다." -ForegroundColor Red
    exit
}

# 원격 레포지토리 최신 정보로 업데이트
Write-Host "`n원격 저장소 정보 업데이트 중..." -ForegroundColor Cyan
git fetch origin

# 원격 브랜치 목록 가져오기 (origin/HEAD 제외)
$branches = git branch -r | Where-Object { 
    $_ -match "origin/" -and 
    $_ -notmatch "origin/HEAD" 
}

# 삭제할 브랜치가 있는지 확인
if (-not $branches) {
    Write-Host "`n삭제할 브랜치가 없습니다. 모든 브랜치가 이미 삭제되었습니다." -ForegroundColor Cyan
    exit
}

Write-Host "`n삭제할 브랜치 목록:" -ForegroundColor Cyan
foreach ($branch in $branches) {
    $branch_name = $branch.Trim()
    Write-Host "- $branch_name" -ForegroundColor Gray
}

# 최종 확인
$finalConfirmation = Read-Host "`n위 브랜치들을 모두 삭제하시겠습니까? (Y/N)"
if ($finalConfirmation -ne 'Y' -and $finalConfirmation -ne 'y') {
    Write-Host "작업이 취소되었습니다." -ForegroundColor Red
    exit
}

Write-Host "`n브랜치 삭제 시작..." -ForegroundColor Cyan

foreach ($branch in $branches) {
    $branch_name = $branch.Trim() -replace "origin/", ""
    
    Write-Host "삭제 중: $branch_name" -ForegroundColor Yellow
    # 원격 브랜치 삭제
    git push origin --delete $branch_name
    
    # 삭제 성공 여부 확인
    if ($LASTEXITCODE -eq 0) {
        Write-Host "성공적으로 삭제됨: $branch_name" -ForegroundColor Green
    } else {
        Write-Host "삭제 실패: $branch_name" -ForegroundColor Red
    }
}

Write-Host "`n----------------------------------------------------" -ForegroundColor Gray
Write-Host "브랜치 삭제 작업 완료!" -ForegroundColor Green
Write-Host "`n남은 브랜치 확인:" -ForegroundColor Cyan
git branch -r 