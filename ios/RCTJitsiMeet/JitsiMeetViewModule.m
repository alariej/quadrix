//
//  JitsiMeetViewModule.m
//  quadrix
//
//  Created by Jean-François Alarie on 12.10.21.
//

#import <React/RCTBridgeModule.h>
#import <React/RCTViewManager.h>

@interface RCT_EXTERN_MODULE(RCTJitsiMeetViewManager, RCTViewManager)
  RCT_EXPORT_VIEW_PROPERTY(options, NSDictionary)
  RCT_EXPORT_VIEW_PROPERTY(onConferenceTerminated, RCTDirectEventBlock)
  RCT_EXPORT_VIEW_PROPERTY(onConferenceJoined, RCTDirectEventBlock)
  RCT_EXPORT_VIEW_PROPERTY(onConferenceWillJoin, RCTDirectEventBlock)
  RCT_EXPORT_VIEW_PROPERTY(onClick, RCTBubblingEventBlock)
@end
