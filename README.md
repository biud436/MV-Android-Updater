# 소개
RPG Maker MV로 안드로이드 앱을 만들었을 때 저용량 앱을 만들기 위하여 실시간 업데이트를 구현하는 것을 생각해볼 수 있습니다. 현재 버전보다 더 상위 버전이 존재할 경우, 리소스를 웹에서 동적으로 내려 받게 됩니다. 

해당 소스 코드는 무료이며 세팅에 어려움이 있으신 경우 아래 메일로 문의해주시기 바랍니다. 이를 위한 대용량 파일 서버는 알아서 준비하셔야 합니다. 본 소스는 드랍박스 무료 계정(하루 트래픽 20GB 제한)을 활용하고 있으며, 특정 드라이브 API를 사용하기 위한 OAuth 인증 과정은 포함되어있지 않습니다. 또한 ```https```가 아닌 경우, ```wireshark``` 같은 네트워크 패킷 감시 프로그램 또는 장비를 통해 리소스 파일의 주소가 역으로 취득될 수 있다는 점을 유념하시기 바랍니다. 이런 경우에 저는 책임지지 않습니다. 본 소스에 포함된 리소스 파일의 주소는 테스트 용도로 만들어진 저용량 리소스 파일이지만 실 테스트 시에는 주소를 다른 것으로 변경해주시기 바랍니다.

문의 : biud436@gmail.com

## 버전 텍스트
버전 텍스트는 ```settings.json``` 파일에 존재하지만 초기 로드 이후 ```localStorage```에 저장됩니다. 즉, 캐시를 비울 시엔 ```settings.json``` 파일에 있는 버전이 기본 버전이 되고 캐시가 남아있으면 ```localStorage```에 있는 버전을 활용합니다. 

## 리소스 파일
리소스 파일은 ZIP로 압축된 파일이여야 합니다. 다른 압축 파일은 압축 해제를 지원하지 않습니다. 압축은 ```js/config.js```의 ```name```명에 해당하는 폴더를 루트 폴더로 삼아 압축이 풀리게 됩니다. 예를 들어 ```name``` 키를 ```me.biud436.fileapi```로 설정했다면 ```sdcard/me.biud436.fileapi/www/``` 폴더에 압축이 풀리게 됩니다. 게임 종료 후, 두 번째 실행할 땐, 리소스 파일이 있는 지를 확인한 후, 실행됩니다. 파일이 없을 경우, 다시 리소스 다운로드를 진행합니다. ```{packageName}``` 텍스트는 이후 ```packageName```으로 자동 대체됩니다. 별도로 바꾸시면 오류가 날 수 있습니다.

```js
let config = {
    packageName : "me.biud436.fileapi",    
    resource : {
        "url" : "https://www.dropbox.com/s/g6yfac905flmna6/Simplify.zip?dl=1",
        "fileUrl" : `cdvfile://localhost/persistent/{packageName}/downloads/Simplify.zip`
    },
    version : {
        "url" : "https://www.dropbox.com/s/j5323z8kv1ln13t/VERSION.txt?dl=1",
        "fileUrl" : `cdvfile://localhost/persistent/{packageName}/VERSION.txt`
    }
};
```

CORS 문제로 인하여 버전 텍스트는 AJAX를 사용하지 않고 로컬에 직접 내려 받게 됩니다. 이때 저장되는 파일의 위치가 ```config.version.fileUrl```입니다. ```cdvfile://localhost/persistent/```는 코르도바 파일 플러그인에서 제공되는 로컬 URI 서비스로 기종마다 다르지만, 보통 안드로이드에서는 파일 권한이 있어야 접근할 수 있는 ```/storage/emulated/0``` 폴더를 나타냅니다. 따라서 버전 텍스트는 ```/storage/emulated/0/me.biud436.fileapi/VERSION.txt```와 같은 경로에 저장됩니다. 최종 경로는 기종마다 달라질 수 있습니다.