//
//  JitsiMeetViewManager.swift
//  quadrix
//
//  Created by Jean-François Alarie on 12.10.21.
//

@objc (JitsiMeetViewManager)
class JitsiMeetViewManager: RCTViewManager {
  
  override func view() -> UIView! {
    let labelView = MyLabelView()
    labelView.textColor = UIColor.orange
    labelView.textAlignment = NSTextAlignment.center
    return labelView
  }

  func updateValueViaManager(_ node:NSNumber) {
    DispatchQueue.main.async {
      let myLabel = self.bridge.uiManager.view(forReactTag: node) as! MyLabelView
      myLabel.updateValue()
    }
  }
}

class MyLabelView: UILabel {
  
  private var _myText:String?
  
  var myText: String? {
    set {
      _myText = newValue
      self.text = newValue
    }
    get {
      return _myText
    }
  }
  
  func updateValue() {
    self.backgroundColor = UIColor.red
    self.myText = "Updated NATIVE value!"
  }
  
}
