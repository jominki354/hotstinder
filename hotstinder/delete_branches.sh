#!/bin/bash

# 메인 브랜치를 제외한 모든 원격 브랜치 삭제 스크립트
echo "GitHub 원격 레포지토리에서 모든 브랜치 삭제를 시작합니다 (main 제외)"
echo "----------------------------------------------------"

# 원격 레포지토리 최신 정보로 업데이트
git fetch origin

# 원격 브랜치 목록 가져오기 (origin/main과 origin/HEAD 제외)
for branch in $(git branch -r | grep 'origin/' | grep -v 'origin/main' | grep -v 'origin/HEAD'); do
    # 브랜치 이름에서 origin/ 부분 제거
    branch_name=${branch#origin/}
    
    echo "삭제 중: $branch_name"
    # 원격 브랜치 삭제
    git push origin --delete $branch_name
done

echo "----------------------------------------------------"
echo "브랜치 삭제 완료!"
echo "남은 브랜치 확인:"
git branch -r 