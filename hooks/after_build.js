#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');
const plist = require('plist');
const xcode = require('xcode');

module.exports = async (context) => {
    const { projectRoot, cordova } = context.opts;
    const platformsRoot = path.join(projectRoot, 'platforms');
    const androidRoot = path.join(platformsRoot, 'android');
    const iosRoot = path.join(platformsRoot, 'ios');

    const iconsDirPath = path.join(projectRoot, 'res', 'alternateIcons');
    const iconFiles = fs.readdirSync(iconsDirPath, { withFileTypes: true })
        .map(file => file.name)
        .filter(fileName => fileName.endsWith('.png'));
    const iconPaths = iconFiles.map(iconFileName => path.join(iconsDirPath, iconFileName));

    const isInstallingAndroid = cordova.platforms.includes('android');
    if (isInstallingAndroid) {
        updateAndroidManifest(androidRoot, iconFiles);
        copyDrawables(androidRoot, iconFiles, iconPaths);
        updateJsVars(iconFiles, [
            path.join(androidRoot, 'platform_www', 'plugins', 'cordova-plugin-alternate-icon', 'www', 'AlternateIcon.js')
        ]);
    }

    const isInstallingiOS = cordova.platforms.includes('ios');
    if (isInstallingiOS) {
        const appName = await getAppNameFromConfig(projectRoot);
        updatePlist(iosRoot, appName, iconFiles);
        copyResources(iosRoot, appName, iconPaths);
        updateJsVars(iconFiles, [
            path.join(iosRoot, 'www', 'plugins', 'cordova-plugin-alternate-icon', 'www', 'AlternateIcon.js'),
            path.join(iosRoot, 'platform_www', 'plugins', 'cordova-plugin-alternate-icon', 'www', 'AlternateIcon.js'),
        ]);
    }
}

function updateAndroidManifest(androidRoot, iconFiles) {
    const manifestPath = path.join(androidRoot, 'app', 'src', 'main', 'AndroidManifest.xml');
    const manifestString = fs.readFileSync(manifestPath).toString();

    if (!manifestString) {
        return console.error('empty manifest');
    }

    xml2js.parseString(manifestString, (err, manifest) => {
        if (err) {
            return console.error(err);
        }

        const manifestRoot = manifest['manifest'];
        const packageName = manifestRoot.$['package'];

        const applicationRoot = manifestRoot.application[0];
        const activityAliases = applicationRoot['activity-alias'] || [];

        const activityRoot = applicationRoot.activity[0];
        const schemeIntent = getSchemeIntent(activityRoot);

        applicationRoot['activity-alias'] = getActivityAliasXML({
            packageName,
            activityAliases,
            iconFiles,
            schemeIntent,
        });

        const builder = new xml2js.Builder();
        fs.writeFileSync(manifestPath, builder.buildObject(manifest), { encoding: 'utf8' });
    });
}

function getSchemeIntent(activityRoot) {
    return activityRoot['intent-filter'].find(intentFilter => {
        const intentData = intentFilter.data?.[0]['$'];
        if (!intentData) {
            return false;
        }
        
        const scheme = intentData['android:scheme']?.trim();
        if (!scheme) {
            return false;
        }
        
        return true;
    });
}

function getActivityAliasXML({ packageName, activityAliases, iconFiles, schemeIntent }) {
    const activityAliasesNames = activityAliases.map(alias => alias.$['android:name']);

    iconFiles.forEach(iconFileName => {
            const [iconName, iconExt] = iconFileName.split('.');

            const activityAliasName = `${packageName}.${iconName}`;
            if (activityAliasesNames.includes(activityAliasName)) {
                return;
            }

            activityAliases.push({
                    '$': {
                        'android:label': '@string/app_name',
                        'android:icon': `@drawable/${iconName}`,
                        'android:name': activityAliasName,
                        'android:targetActivity': `${packageName}.MainActivity`,
                        'android:enabled': false,
                    },
                    'intent-filter': [
                        {
                            'action': {
                                '$': {
                                    'android:name': 'android.intent.action.MAIN',
                                },
                            },
                            'category': {
                                '$': {
                                    'android:name': 'android.intent.category.LAUNCHER',
                                }
                            },
                        },
                        { ...schemeIntent }
                    ]
                });
            });

        return activityAliases;
    }

    function copyDrawables(androidRoot, iconFiles, iconPaths) {
        const resRoot = path.join(androidRoot, 'app', 'src', 'main', 'res');
        const drawableDirs = [
            path.join(resRoot, 'drawable-hdpi'),
            path.join(resRoot, 'drawable-mdpi'),
            path.join(resRoot, 'drawable-xhdpi'),
            path.join(resRoot, 'drawable-xxhdpi'),
            path.join(resRoot, 'drawable-xxxhdpi'),
        ];

        drawableDirs.forEach(drawableDir => {
            iconPaths.forEach((iconFilePath, i) => {
                fs.copyFileSync(iconFilePath, path.join(drawableDir, iconFiles[i]));
            });
        });
    }

    async function getAppNameFromConfig(projectRoot) {
        const configPath = path.join(projectRoot, 'config.xml');
        const configString = fs.readFileSync(configPath).toString();

        if (!configString) {
            return console.error('empty config');
        }

        const parser = new xml2js.Parser();
        const config = await parser.parseStringPromise(configString);
        const appName = config.widget.name[0];

        return appName;
    }

    function copyResources(iosRoot, appName, iconPaths) {
        const pbxProjectPath = path.join(iosRoot, `${appName}.xcodeproj`, 'project.pbxproj');
        const xcodeProject = xcode.project(pbxProjectPath);
        xcodeProject.parseSync();

        iconPaths.forEach(iconFilePath => {
            xcodeProject.addResourceFile(iconFilePath);
        });

        fs.writeFileSync(pbxProjectPath, xcodeProject.writeSync());
    }

    function updatePlist(iosRoot, appName, iconFiles) {
        const plistPath = path.join(iosRoot, appName, `${appName}-Info.plist`);
        const plistContent = fs.readFileSync(plistPath, 'utf8');
        const plistObj = plist.parse(plistContent);

        plistObj['CFBundleIcons'] = plistObj['CFBundleIcons'] || {};
        plistObj['CFBundleIcons'].CFBundleAlternateIcons = plistObj['CFBundleIcons'].CFBundleAlternateIcons || {};

        iconFiles.forEach(iconFileName => {
            const [iconName, iconExt] = iconFileName.split('.');

            plistObj['CFBundleIcons'].CFBundleAlternateIcons[iconName] = {
                'UIPrerenderedIcon': true,
                'CFBundleIconFiles': [iconName]
            }
        });

        const updatedPlist = plist.build(plistObj);
        fs.writeFileSync(plistPath, updatedPlist, { encoding: 'utf8' });
    }

    function updateJsVars(iconFiles, jsFiles) {
        const iconNames = iconFiles.map(fileName => fileName.split('.')[0]).join('","');

        jsFiles = Array.isArray(jsFiles) ? jsFiles : [jsFiles];
        for (let i in jsFiles) {
            try {
                const currentFile = jsFiles[i];
                const content = fs.readFileSync(currentFile).toString();
                fs.writeFileSync(currentFile, content.replace(/AVAILABLE_OPTIONS/, iconNames));
            } catch (err) {
                console.error(err)
            }
        }
    }