//
//  JitsiMeetViewModule.m
//  quadrix
//
//  Created by Jean-François Alarie on 12.10.21.
//

#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(JitsiMeet, NSObject)
  RCT_EXTERN_METHOD(launch:(NSDictionary)options)
@end
