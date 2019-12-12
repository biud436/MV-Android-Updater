let utils = {

    echoTextFile() {

        jQuery.ajax({
            url: "./settings.json",
            type: "get",
            dataType: "JSON",
            success: (data) => {
                const packageName = config.packageName;

                window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, (fs) => {
                    
                    // 폴더 생성 (폴더가 없으면 자동으로 생성한다)
                    fs.root.getDirectory(packageName, {create:true, exclusive:false}, dirEntry => {
        
                    }, this.errorCallback);

                    // 파일 생성
                    fs.root.getFile(`${packageName}/testfile.txt`, {create: true, exclusive: false}, 
                        parent => { 
                            parent.createWriter(writer => {
                                writer.onwriteend = function() {
                                    console.log("Completed to write a text file called testfile.txt");
                                };

                                const data = new Blob(["Hi...."], {type : 'text/plain'});

                                writer.write(data);                                
                            }, this.errorCallback);
                        }, 
                    this.errorCallback);

                    // 파일 읽기
                    fs.root.getFile(`${packageName}/testfile.txt`, {create: true, exclusive: false}, 
                        parent => { 
                            parent.file(file => {

                                /**
                                 * @type {FileReader}
                                 */
                                const reader = new FileReader();
                                reader.onload = function() {
                                    console.log(this.result);
                                };

                                reader.readAsText(file);
                                
                            }, this.errorCallback);
                        }
                    , this.errorCallback);
                    
                    // 끝

                }, this.errorCallback);
            },
            error: (xhr, status, error) => {

            }
        });

    },
    
    errorCallback(err) {
        console.warn(err);
    },

    checkVersion(callback) {
        let uri = encodeURI(config.version.url);
        let fileUri = config.version.fileUrl.replace("{packageName}", config.packageName);

        let fileTransfer = new FileTransfer();

        fileTransfer.download(uri, fileUri, (entry) => {

            entry.file(file => {

                var reader = new FileReader();
        
                reader.onloadend = function () {
                    callback(this.result);
                };
        
                reader.readAsText(file);  

            }, this.errorCallback);
        }, this.errorCallback, false, {});

        window.resolveLocalFileSystemURL(fileUri, 
            /**
             * @param {FileEntry} entry
             */
            entry => {
                entry.file(file => {
                    var reader = new FileReader();
        
                    reader.onloadend = function () {
                        callback(this.result);
                    };
            
                    reader.readAsText(file);                      
                }, this.errorCallback);
        }, this.errorCallback);
    },

    testDownloadZip() {
        
        let fileTransfer = new FileTransfer();
        let uri = encodeURI(config.resource.url);
        let fileUri = config.resource.fileUrl.replace("{packageName}", config.packageName);
        const packageName = config.packageName;

        fileTransfer.onprogress = function(progressEvent) {
            var percent =  Math.round((progressEvent.loaded / progressEvent.total) * 100);
            $(".ui.text.loader").text(`Downloading... ${percent} %`);
        };

        fileTransfer.download(uri, fileUri, 

            /**
             * @param {FileEntry} entry
             */
            entry => {
                console.log("download complete: " + entry.toURL());

                let zipPath = fileUri;
                let extractDir = `cdvfile://localhost/persistent/${packageName}/www/`;

                // 파일의 압축을 해제한다.
                window.zip.unzip(zipPath, extractDir, status => {
                    switch(status) {
                        case 0: // 압축 해제 성공 시
                            $(".ui.text.loader").text("Successed to uncompress...");                            
                            $(".ui.text.loader").hide();

                            window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, (fs) => {
                                fs.root.getDirectory(`${config.packageName}/downloads/`, {create:true, exclusive:false}, dirEntry => {
                                    dirEntry.removeRecursively(() => {
                                        console.log("Removed the resource file from downloads folder");
                                        window.open(`cdvfile://localhost/persistent/${packageName}/www/index.html`, "_self");
                                    }, this.errorCallback);
                                }, this.errorCallback);
                            }, this.errorCallback);

                            break;
                        default: // 압축 해제 실패
                            console.log("Failed to uncompress...");
                            break;
                    }
                }, function(progressEvent) {
                    var percent =  Math.round((progressEvent.loaded / progressEvent.total) * 100);
                    $(".ui.text.loader").text(`Uncompressing... ${percent} %`);                    
                });

            },
            error => {
                console.log("download error source " + error.source);
                console.log("download error target " + error.target);
                console.log("download error code" + error.code);
            },
            false, 
            {}
        );


    }

}

let app = {

    initialize() {
        document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);      
    },
    
    onDeviceReady() {
        this.receivedEvent('deviceready');
    },

    onStart() {

        let errorCallback = err => {
            utils.testDownloadZip();
        };

        let indexFileUri = `cdvfile://localhost/persistent/${config.packageName}/www/index.html`;
        window.resolveLocalFileSystemURL(indexFileUri, 

            /**
             * @param {FileEntry} entry
             */
            entry => {
                
                // 해당 위치에 파일이 있으면 실행한다 => fs.existSync(indexFileUri)와 비슷
                entry.file(file => {
                    window.open(indexFileUri, "_self");                   
                }, errorCallback);

        }, errorCallback);

    },
    
    receivedEvent(id) {
        
        jQuery.ajax({
            url: "./settings.json",
            type: "get",
            dataType: "JSON",
            success: (data) => {

                let tempVersion = localStorage.getItem("version");
                if(!tempVersion) {
                    localStorage.setItem("version", data.version);
                    tempVersion = data.version;
                }
                let currentVersion = tempVersion;

                document.title = `${data.title} v${currentVersion}`;
                
                // 폴더 생성 및 삭제, 파일 생성이 가능한 지 확인한다.
                utils.echoTextFile();

                // 버전 비교 후 리소스 업데이트 진행
                utils.checkVersion(contents => {
                    if(/(\d+\.\d+\.\d+)/gm.exec(contents)) {
                        let targetVersion = RegExp.$1;
                        if(currentVersion < targetVersion) {
                            // 웹에서 리소스 파일을 내려 받아 압축을 해제한다.
                            utils.testDownloadZip();
                        } else {
                            this.onStart();
                        }
                    }
                });
            },
            error: (xhr, status, error) => {

            }
        });

    }

};
    
app.initialize();