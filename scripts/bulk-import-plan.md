# bulk-import-plan.md

다음 단계에서 붙일 bulk import 방향.

## 목표
CSV 템플릿을 기반으로 골프장 / 정책 / 출처를 빠르게 반영.

## 후보 방식
1. 관리자 UI 업로드
2. 로컬 node 스크립트로 Supabase insert
3. GitHub Actions 수동 실행형 import

## 추천
- 1차: 로컬 node 스크립트
- 2차: 관리자 UI 업로드

## 이유
- 현재는 이미 관리자 UI가 존재하므로, 대량 입력이 필요한 시점까진 CSV 정리 + 수동 반영도 가능
- 그러나 20개 이상부터는 스크립트 import가 훨씬 빠름
