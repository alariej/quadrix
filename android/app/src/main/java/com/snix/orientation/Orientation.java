package chat.quadrix.android;

import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import android.view.OrientationEventListener;
import android.hardware.SensorManager;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import android.app.Activity;
import android.view.View;

public class Orientation extends ReactContextBaseJavaModule {

    OrientationEventListener orientationEventListener;
    ReactContext reactContext;

    Orientation(ReactApplicationContext context) {
        super(context);

        reactContext = context;
    }

    @Override
    public String getName() {
        return "Orientation";
    }

    @ReactMethod
    public void start() {
        orientationListener();
    }

    @ReactMethod
    public void stop() {
        orientationEventListener.disable();
    }

    @ReactMethod
    public void fullscreenOn() {
        final Activity reactActivity = reactContext.getCurrentActivity();
        final int flags = View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_FULLSCREEN
                | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY;

        if (reactActivity != null) {
            reactActivity.runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    reactActivity.getWindow()
                        .getDecorView()
                        .setSystemUiVisibility(flags);
                }
            });
        }
    }

    @ReactMethod
    public void fullscreenOff() {
        final Activity reactActivity = reactContext.getCurrentActivity();
        final int flag = View.SYSTEM_UI_FLAG_VISIBLE;

        if (reactActivity != null) {
            reactActivity.runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    reactActivity.getWindow()
                        .getDecorView()
                        .setSystemUiVisibility(flag);
                }
            });
        }
    }

    private void orientationListener() {

		orientationEventListener = new OrientationEventListener(reactContext, SensorManager.SENSOR_DELAY_NORMAL)
	    {

            String previousOrientation = "";

		    @Override
            public void onOrientationChanged(int orientation) {

                String deviceOrientation = "";
                if (orientation < 290 && orientation > 250) {
                    deviceOrientation = "landscapeL";
                } else if (orientation < 110 && orientation > 70) {
                    deviceOrientation = "landscapeR";
                } else {
                    deviceOrientation = "portrait";
                }

                if (deviceOrientation != previousOrientation) {

                    previousOrientation = deviceOrientation;

                    try {

                        reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                        .emit("orientationChanged", deviceOrientation);

                    } catch (RuntimeException error) {

                        error.printStackTrace();
                    }
                }
            }
	    };

	    orientationEventListener.enable();
	}
}
