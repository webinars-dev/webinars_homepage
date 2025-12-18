import React from 'react';

import { cn } from './cn';

export function Separator({ className, orientation = 'horizontal', decorative = true, ...props }) {
  const isHorizontal = orientation === 'horizontal';

  return (
    <div
      role={decorative ? undefined : 'separator'}
      aria-orientation={decorative ? undefined : orientation}
      className={cn(isHorizontal ? 'h-px w-full bg-border' : 'h-full w-px bg-border', className)}
      {...props}
    />
  );
}

export default Separator;

