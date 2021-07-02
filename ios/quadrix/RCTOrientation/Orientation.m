#import "Orientation.h"

@implementation Orientation
{
  bool hasListeners;
}

RCT_EXPORT_MODULE();

- (NSArray<NSString *> *)supportedEvents {
  return @[@"orientationChanged"];
}

-(void)startObserving {
  hasListeners = YES;
  [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(deviceOrientationChanged:) name:UIDeviceOrientationDidChangeNotification object:nil];
}

-(void)stopObserving {
  hasListeners = NO;
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (void)deviceOrientationChanged:(NSNotification *)notification {
  UIDeviceOrientation orientation = [[UIDevice currentDevice] orientation];
  if (hasListeners) {
    if (orientation == UIDeviceOrientationLandscapeLeft) {
      [self sendEventWithName:@"orientationChanged" body:@"landscapeL"];
    } else if (orientation == UIDeviceOrientationLandscapeRight) {
      [self sendEventWithName:@"orientationChanged" body:@"landscapeR"];
    } else if (orientation == UIDeviceOrientationPortrait) {
      [self sendEventWithName:@"orientationChanged" body:@"portrait"];
    }
  }
}

@end
