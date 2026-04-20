"use client";

export function save(key: string, value: any) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function load(key: string) {
  const v = localStorage.getItem(key);
  return v ? JSON.parse(v) : null;
}
