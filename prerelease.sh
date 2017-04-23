curl https://raw.githubusercontent.com/electron-userland/electron-packager/master/test/ci/before_install.sh | bash 
if [[ "$TRAVIS_OS_NAME" == "osx" ]]; then
	echo $CERTIFICATE_OSX_P12 | base64 --decode > certificate.p12
	security create-keychain -p $KEYCHAIN_PASSWORD build.keychain
	security default-keychain -s build.keychain
	security unlock-keychain -p $KEYCHAIN_PASSWORD build.keychain
	security import certificate.p12 -k build.keychain -P $CERT_PASSWORD -T /usr/bin/codesign
	node package.js darwin
else
	node package.js win32,linux
fi
