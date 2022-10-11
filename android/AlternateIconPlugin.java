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

        if ("change".equals(action)) {
            JSONObject options = args.getJSONObject(0);
            selectedOption = options.getString("selected");
            availableOptions = options.getJSONArray("available");
            PluginResult result = new  PluginResult(PluginResult.Status.OK, selectedOption); 
            callbackContext.sendPluginResult(result);
            return true;
        }

        return false;
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

    @Override
    public void onDestroy() {
        if (selectedOption != null && availableOptions.length() > 0) {
            setComponentEnabled("MainActivity", selectedOption.equals("null"));

            for (int i = 0; i < availableOptions.length(); i++) {
                try {
                    String currentOption = availableOptions.getString(i);
                    setComponentEnabled(currentOption, currentOption.equals(selectedOption));
                } catch (JSONException e) {
                }
            }
        }
    }

}
