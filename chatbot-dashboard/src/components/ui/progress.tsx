import * as React from "react";

export function Progress({ value }: { value: number }) {
  return (
    <div className="w-full h-2 bg-gray-700 rounded">
      <div
        className="h-2 bg-green-500 rounded transition-all duration-300"
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  );
}
