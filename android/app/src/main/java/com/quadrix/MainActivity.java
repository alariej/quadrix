package chat.quadrix.android;

import android.os.Bundle;
import android.content.Intent;
import android.content.Context;
import android.content.res.Configuration;
import android.app.NotificationManager;
import android.util.Log;
import android.database.Cursor;
import android.provider.OpenableColumns;
import android.net.Uri;

import com.facebook.react.ReactActivity;
import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import javax.annotation.Nullable;
import org.json.JSONException;
import org.json.JSONObject;

public class MainActivity extends ReactActivity {

    /**
     * Returns the name of the main component registered from JavaScript.
     * This is used to schedule rendering of the component.
     */
    @Override
    protected String getMainComponentName() {
        return "RXApp";
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        NotificationManager notificationManager = (NotificationManager)getSystemService(Context.NOTIFICATION_SERVICE);
        notificationManager.cancelAll();
    }

    @Override
    protected void onResume() {
        super.onResume();

        NotificationManager notificationManager = (NotificationManager)getSystemService(Context.NOTIFICATION_SERVICE);
        notificationManager.cancelAll();
    }

    @Override
    public void onNewIntent(Intent intent) {
        super.onNewIntent(intent);

        if (Intent.ACTION_SEND.equals(intent.getAction())) {

            String mimeType = intent.getType();
            String uri = "";
            String fileName = "";
            String fileSize = "";

            if (mimeType.startsWith("image/") || mimeType.startsWith("application/")) {

                Uri _uri = intent.getParcelableExtra(Intent.EXTRA_STREAM);

                Cursor returnCursor = getContentResolver().query(_uri, null, null, null, null);

                int nameIndex = returnCursor.getColumnIndex(OpenableColumns.DISPLAY_NAME);
                int sizeIndex = returnCursor.getColumnIndex(OpenableColumns.SIZE);
                returnCursor.moveToFirst();

                uri = _uri.toString();
                fileName = returnCursor.getString(nameIndex);
                fileSize = Long.toString(returnCursor.getLong(sizeIndex));

            } else if (mimeType.startsWith("text/")) {

                uri = intent.getStringExtra(Intent.EXTRA_TEXT);
            }

            ReactContext reactContext = this.getReactInstanceManager().getCurrentReactContext();

            if (uri != "" && reactContext != null) {

                JSONObject contentJSON = new JSONObject();
                WritableMap event = Arguments.createMap();

                try {

                    contentJSON.put("mimeType", mimeType);
                    contentJSON.put("uri", uri);
                    contentJSON.put("fileName", fileName);
                    contentJSON.put("fileSize", fileSize);

                    event.putString("url", contentJSON.toString());

                    reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                    .emit("url", event);

                } catch (JSONException error) {

                    error.printStackTrace();
                }
            }
        }
    }

    @Override
    protected ReactActivityDelegate createReactActivityDelegate() {
        return new ReactActivityDelegate(this, getMainComponentName()) {

            @Nullable
            @Override
            protected Bundle getLaunchOptions() {

                Bundle initialProps = new Bundle();
                Intent intent = getIntent();

                if (Intent.ACTION_SEND.equals(intent.getAction())) {

                    String mimeType = intent.getType();
                    String uri = "";
                    String fileName = "";
                    String fileSize = "";

                    if (mimeType.startsWith("image/") || mimeType.startsWith("application/")) {

                        Uri _uri = intent.getParcelableExtra(Intent.EXTRA_STREAM);

                        Cursor returnCursor = getContentResolver().query(_uri, null, null, null, null);

                        int nameIndex = returnCursor.getColumnIndex(OpenableColumns.DISPLAY_NAME);
                        int sizeIndex = returnCursor.getColumnIndex(OpenableColumns.SIZE);
                        returnCursor.moveToFirst();

                        uri = _uri.toString();
                        fileName = returnCursor.getString(nameIndex);
                        fileSize = Long.toString(returnCursor.getLong(sizeIndex));

                    } else if (mimeType.startsWith("text/")) {

                        uri = intent.getStringExtra(Intent.EXTRA_TEXT);
                    }

                    if (uri != "") {

                        JSONObject contentJSON = new JSONObject();

                        try {

                            contentJSON.put("mimeType", mimeType);
                            contentJSON.put("uri", uri);
                            contentJSON.put("fileName", fileName);
                            contentJSON.put("fileSize", fileSize);

                            initialProps.putString("sharedContent", contentJSON.toString());

                        } catch (JSONException error) {

                            error.printStackTrace();
                        }
                    }
                }
                return initialProps;
            }
        };
    }
}
