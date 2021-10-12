//
//  JitsiMeetViewModule.m
//  quadrix
//
//  Created by Jean-François Alarie on 12.10.21.
//

#import <React/RCTBridgeModule.h>
#import <React/RCTViewManager.h>

@interface RCT_EXTERN_MODULE(JitsiMeetViewManager, RCTViewManager)

RCT_EXPORT_VIEW_PROPERTY(myText, NSString)

RCT_EXTERN_METHOD(updateValueViaManager:(nonnull NSNumber *)node)

@end
