# InsunetFC DVM

**ElectronJS 기반**

디바이스 시리얼 번호
자리비움 관련 기능 (CRM 연계)
자동업데이트

## Install
```bash
yarn
```

## Quick Start
```bash
yarn start
```
## Build
### Window / MacOS 지원
```bash
yarn dist
```

## electron-updater
### Window 만 지원
AWS S3 버킷 : insunetfc-device-manager 빌드후 생성되는 latest.yml 업로드 및 version 파일 내용 업데이트 필요
insunetfc-device-manager 버킷에 해당 버전의 설치 파일 업로드
*latest.yml
*version
모두 완료하였으면 DVM 실행시 자동으로 업데이트함.


[CC0 1.0 (Public Domain)](LICENSE.md)
