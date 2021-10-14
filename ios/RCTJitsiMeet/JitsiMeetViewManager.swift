//
//  JitsiMeetViewManager.swift
//  quadrix
//
//  Created by Jean-François Alarie on 12.10.21.
//
import UIKit
import JitsiMeetSDK
import React

@objc (RCTJitsiMeetViewManager) // shows up as RCTJitsiMeetView on the RN side
class RCTJitsiMeetViewManager: RCTViewManager {

  override func view() -> UIView! {
    return JitsiMeetView_()
    // return setTestView()
  }

  override class func requiresMainQueueSetup() -> Bool {
    return true
  }
}

private func setTestView() -> UIView {
  let testView = TestView()
  testView.textColor = UIColor.white
  testView.textAlignment = NSTextAlignment.center
  testView.backgroundColor = .red
  return testView
}

class TestView: UILabel {
  private var _options: NSDictionary?
  @objc var options: NSDictionary? {
    set {
      _options = newValue
      self.text = _options?["room"] as? String
    }
    get {
      return _options
    }
  }

  @objc var onConferenceTerminated: RCTDirectEventBlock?
  @objc var onConferenceJoined: RCTDirectEventBlock?
  @objc var onConferenceWillJoin: RCTDirectEventBlock?

  @objc var onClick: RCTBubblingEventBlock?
  open override func touchesEnded(_ touches: Set<UITouch>, with event: UIEvent?) {
    guard let onClick = self.onClick else { return }
    let data: [AnyHashable: Any] = ["event": event as Any]
    onClick(data)
  }
}

class JitsiMeetView_: JitsiMeetView {
  @objc var options: NSDictionary? {
    willSet {
      if let newOptions = newValue {
        // self.isUserInteractionEnabled = false
        joinCall(newOptions)
      }
    }
  }

  @objc var onConferenceTerminated: RCTDirectEventBlock?
  @objc var onConferenceJoined: RCTDirectEventBlock?
  @objc var onConferenceWillJoin: RCTDirectEventBlock?

  override init(frame: CGRect) {
    super.init(frame: frame)
    delegate = self
  }

  // does not work in stopping propagation
  open override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {}
  open override func touchesMoved(_ touches: Set<UITouch>, with event: UIEvent?) {}
  open override func touchesCancelled(_ touches: Set<UITouch>, with event: UIEvent?) {}

  // sends touch events to RN for test purposes
  @objc var onClick: RCTBubblingEventBlock?
  open override func touchesEnded(_ touches: Set<UITouch>, with event: UIEvent?) {
    guard let onClick = self.onClick else { return }
    let data: [AnyHashable: Any] = ["event": event as Any]
    onClick(data)
  }

  required init?(coder: NSCoder) {
    super.init(coder: coder)
  }

  func joinCall(_ options: NSDictionary) {
    DispatchQueue.main.async {
      self.join(JitsiMeetBuilder.buildConferenceOptions(options))
    }
  }

  func leaveCall() {
    leave()
    hangUp()
  }

  override func removeFromSuperview() {
    leaveCall()
    super.removeFromSuperview()
  }
}

extension JitsiMeetView_: JitsiMeetViewDelegate {
  func conferenceTerminated(_ data: [AnyHashable : Any]!) {
    onConferenceTerminated?(data)
  }

  func conferenceJoined(_ data: [AnyHashable : Any]!) {
    onConferenceJoined?(data)
  }

  func conferenceWillJoin(_ data: [AnyHashable : Any]!) {
    onConferenceWillJoin?(data)
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
