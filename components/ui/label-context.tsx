"use client";

import * as React from "react";

/**
 * Accessible names for form controls without repeating ids everywhere:
 * - <Field> provides an id; the first Input/Select/Textarea inside uses it, so the label is linked.
 * - Settings rows provide the id of their title; Switch/Select/Input inside use it as aria-labelledby.
 */
export const FieldIdContext = React.createContext<string | null>(null);
export const LabelledByContext = React.createContext<string | null>(null);
