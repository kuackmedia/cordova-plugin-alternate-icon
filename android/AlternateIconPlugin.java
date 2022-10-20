package com.kuack.plugins;

import java.lang.Integer;
import android.app.Activity;
import android.os.Bundle;
import android.content.Context;
import java.util.ArrayList;
import java.util.List;
import java.io.IOException;
import android.util.Log;
import android.content.Intent;
import android.app.PendingIntent;
import java.lang.ref.WeakReference;

import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CordovaWebView;
import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaInterface;
import org.apache.cordova.PluginResult;

import org.json.JSONObject;
import org.json.JSONArray;
import org.json.JSONException;

import android.content.pm.PackageManager;
import android.content.ComponentName;
import android.app.Activity;

import android.util.Log;

public class AlternateIconPlugin extends CordovaPlugin {
    private String selectedOption;
    private JSONArray availableOptions;
    private Activity cordovaActivity;

    @Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
        cordovaActivity = cordova.getActivity();

        if ("getCurrentName".equals(action)) {
            JSONObject options = args.getJSONObject(0);
            JSONArray available = options.getJSONArray("available");

            String iconName = getEnabledIconName(available);
            PluginResult result = new  PluginResult(PluginResult.Status.OK, iconName); 
            callbackContext.sendPluginResult(result);
            return true;
        }

        else if ("change".equals(action)) {
            updateOptions(args);

            PluginResult result = new  PluginResult(PluginResult.Status.OK, selectedOption); 
            callbackContext.sendPluginResult(result);
            return true;
        }

        else if ("changeAndRestart".equals(action)) {
            updateOptions(args);
            setSelectedIcon();

            Context context = cordovaActivity.getApplicationContext();
            Intent launchIntent = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
            cordovaActivity.finishAffinity();
            cordovaActivity.startActivity(launchIntent);

            PluginResult result = new PluginResult(PluginResult.Status.OK, selectedOption);
            callbackContext.sendPluginResult(result);

            return true;
        }

        return false;
    }

    @Override
    public void onDestroy() {
        setSelectedIcon();
    }

    private void updateOptions(JSONArray args) {
        try {
            JSONObject options = args.getJSONObject(0);
            availableOptions = options.getJSONArray("available");
            selectedOption = options.getString("selected");
        } catch (JSONException e) {
        }
    }

    private void setSelectedIcon() {
        if (selectedOption == null || availableOptions.length() == 0) {
            return;
        }

        setComponentEnabled("MainActivity", selectedOption.equals("null"));

        for (int i = 0; i < availableOptions.length(); i++) {
            try {
                String currentOption = availableOptions.getString(i);
                setComponentEnabled(currentOption, currentOption.equals(selectedOption));
            } catch (JSONException e) {
            }
        }
    }

    private void setComponentEnabled(String componentName, Boolean enabled) {
        Context context = cordovaActivity.getApplicationContext();
        String packageName = context.getPackageName();
        PackageManager pm = cordovaActivity.getPackageManager();
        
        int state = enabled
            ? PackageManager.COMPONENT_ENABLED_STATE_ENABLED
            : PackageManager.COMPONENT_ENABLED_STATE_DISABLED;
        
        pm.setComponentEnabledSetting(
            new ComponentName(cordovaActivity, packageName + "." + componentName),
            state,
            PackageManager.DONT_KILL_APP
        );
    }

    private int getComponentEnabled(String componentName) {
        Context context = cordovaActivity.getApplicationContext();
        String packageName = context.getPackageName();
        PackageManager pm = cordovaActivity.getPackageManager();

        int state = pm.getComponentEnabledSetting(
            new ComponentName(cordovaActivity, packageName + "." + componentName)
        );

        return state;
    }

    private String getEnabledIconName(JSONArray available) {
        Context context = cordovaActivity.getApplicationContext();
        String packageName = context.getPackageName();
        PackageManager pm = cordovaActivity.getPackageManager();

        int mainActivityState = getComponentEnabled("MainActivity");
        if (mainActivityState == PackageManager.COMPONENT_ENABLED_STATE_DEFAULT ||
            mainActivityState == PackageManager.COMPONENT_ENABLED_STATE_ENABLED) {
            return "default";
        }

        for (int i = 0; i < available.length(); i++) {
            try {
                String optionName = available.getString(i);
                int optionState = pm.getComponentEnabledSetting(
                    new ComponentName(cordovaActivity, packageName + "." + optionName)
                );

                if (optionState == PackageManager.COMPONENT_ENABLED_STATE_ENABLED) {
                    return optionName;
                }
            } catch (JSONException e) {
            }
        }

        return null;
    }
}
