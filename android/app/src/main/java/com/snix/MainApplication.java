package chat.quadrix.android;

import android.app.Application;

import com.facebook.react.PackageList;
import com.facebook.react.ReactApplication;
import com.reactnativecommunity.webview.RNCWebViewPackage;
import cl.json.RNSharePackage;
import io.github.elyx0.reactnativedocumentpicker.DocumentPickerPackage;
import io.invertase.firebase.messaging.ReactNativeFirebaseMessagingPackage;
import io.invertase.firebase.app.ReactNativeFirebaseAppPackage;
import com.reactnativecommunity.netinfo.NetInfoPackage;
import fr.bamlab.rnimageresizer.ImageResizerPackage;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.soloader.SoLoader;
import androidx.annotation.Nullable;

import java.util.List;

public class MainApplication extends Application implements ReactApplication {

  private final ReactNativeHost mReactNativeHost = new ReactNativeHost(this) {
    @Override
    public boolean getUseDeveloperSupport() {
      return BuildConfig.DEBUG;
    }

    @Override
    protected List<ReactPackage> getPackages() {
        @SuppressWarnings("UnnecessaryLocalVariable")
        List<ReactPackage> packages = new PackageList(this).getPackages();
        // Packages that cannot be autolinked yet can be added manually here, for example:
        packages.add(new OrientationPackage());
        return packages;
    }

    @Override
    protected String getJSMainModuleName() {
      return "index";
    }

    @Override
    protected @Nullable String getBundleAssetName() {
      return "app.bundle";
    }
  };

  @Override
  public ReactNativeHost getReactNativeHost() {
    return mReactNativeHost;
  }

  @Override
  public void onCreate() {
    super.onCreate();
    SoLoader.init(this, /* native exopackage */ false);
  }
}
