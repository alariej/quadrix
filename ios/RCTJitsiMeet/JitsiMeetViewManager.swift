import UIKit
import JitsiMeetSDK

class JitsiMeetViewController: UIViewController {
  var conferenceOptions: JitsiMeetConferenceOptions?
  
  override func viewDidLoad() {
    let jitsiMeetView = JitsiMeetView()
    
    jitsiMeetView.join(conferenceOptions)
    jitsiMeetView.delegate = self
    
    view = jitsiMeetView
  }
}

extension JitsiMeetViewController: JitsiMeetViewDelegate {
  func conferenceTerminated(_ data: [AnyHashable : Any]!) {
    DispatchQueue.main.async {
        let rootViewController = UIApplication.shared.delegate?.window??.rootViewController as! UINavigationController
        rootViewController.popViewController(animated: false)
    }
  }
}

@objc(JitsiMeet)
class JitsiMeet: NSObject {
  @objc func launch(_ options: NSDictionary) {
    DispatchQueue.main.async {
      let rootViewController = UIApplication.shared.delegate?.window??.rootViewController as! UINavigationController
      let vc = JitsiMeetViewController()
      
      vc.modalPresentationStyle = .fullScreen
      vc.conferenceOptions = JitsiMeetBuilder.buildConferenceOptions(options)
                
      rootViewController.pushViewController(vc, animated: false)
    }
  }
  
  @objc
  static func requiresMainQueueSetup() -> Bool {
    return true
  }
}

struct JitsiMeetBuilder {
  static func buildConferenceOptions(_ options: NSDictionary) -> JitsiMeetConferenceOptions {
    return JitsiMeetConferenceOptions.fromBuilder { (builder) in
      guard let room = options["room"] as? String else {
        fatalError("Room ID cannot be empty")
      }

      builder.room = room

      builder.serverURL = URL(string: (options["serverUrl"] as? String) ?? "https://meet.jit.si")

      if let userInfo = options["userInfo"] as? NSDictionary {
        let conferenceUserInfo = JitsiMeetUserInfo()

        if let displayName = userInfo["displayName"] as? String {
          conferenceUserInfo.displayName = displayName
        }

        if let email = userInfo["email"] as? String {
          conferenceUserInfo.email = email
        }

        if let avatar = userInfo["avatar"] as? String {
          conferenceUserInfo.avatar = URL(string: avatar)
        }

        builder.userInfo = conferenceUserInfo
      }

      if let token = options["token"] as? String {
        builder.token = token
      }

      if let featureFlags = options["featureFlags"] as? Dictionary<String, Any> {
        featureFlags.forEach{ key,value in
          builder.setFeatureFlag(key, withValue: value)
        }
      }
    }
  }
}
