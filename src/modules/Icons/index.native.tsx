import React from 'react';
import IcoMoon, { IconProps } from 'react-icomoon';
import { Svg, Path } from "react-native-svg";
import iconSet from '../../resources/icons/icons.json';

const Icon = (props: IconProps) => (
  <IcoMoon
    native
    SvgComponent={Svg}
    PathComponent={Path}
    iconSet={iconSet}
    {...props}
  />
);

export default Icon;