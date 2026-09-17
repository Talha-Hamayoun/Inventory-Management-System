"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/src/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

function flattenLabel(node: React.ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(flattenLabel).join("");
  return "";
}

function optionsFromChildren(children: React.ReactNode): SelectOption[] {
  const options: SelectOption[] = [];
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child) || child.type !== "option") return;
    const props = child.props as {
      value?: string | number;
      children?: React.ReactNode;
      disabled?: boolean;
    };
    options.push({
      value: props.value != null ? String(props.value) : "",
      label: flattenLabel(props.children) || String(props.value ?? ""),
      disabled: props.disabled,
    });
  });
  return options;
}

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  error?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      children,
      value,
      defaultValue,
      onChange,
      onBlur,
      disabled,
      name,
      required,
      error,
      id,
      ...props
    },
    forwardedRef
  ) => {
    const options = React.useMemo(() => optionsFromChildren(children), [children]);
    const nativeRef = React.useRef<HTMLSelectElement | null>(null);
    const triggerRef = React.useRef<HTMLButtonElement>(null);
    const panelRef = React.useRef<HTMLDivElement>(null);
    const [open, setOpen] = React.useState(false);
    const [query, setQuery] = React.useState("");
    const [internal, setInternal] = React.useState(
      String(value ?? defaultValue ?? "")
    );
    const [coords, setCoords] = React.useState({ top: 0, left: 0, width: 0, openUp: false });
    const [activeIndex, setActiveIndex] = React.useState(0);

    const selected = value !== undefined ? String(value) : internal;
    const selectedOption = options.find((option) => option.value === selected);
    const placeholder = options.find((option) => option.value === "")?.label;
    const showSearch = options.length > 8;
    const filtered = query.trim()
      ? options.filter((option) =>
          option.label.toLowerCase().includes(query.trim().toLowerCase())
        )
      : options;

    const setNativeRef = React.useCallback(
      (node: HTMLSelectElement | null) => {
        nativeRef.current = node;
        if (typeof forwardedRef === "function") forwardedRef(node);
        else if (forwardedRef) forwardedRef.current = node;
      },
      [forwardedRef]
    );

    const updateCoords = React.useCallback(() => {
      const trigger = triggerRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const panelHeight = Math.min(280, 52 + filtered.length * 40);
      const openUp = window.innerHeight - rect.bottom < panelHeight && rect.top > panelHeight;
      setCoords({
        top: openUp ? rect.top : rect.bottom,
        left: rect.left,
        width: Math.max(rect.width, 180),
        openUp,
      });
    }, [filtered.length]);

    React.useEffect(() => {
      if (value !== undefined) setInternal(String(value));
    }, [value]);

    React.useEffect(() => {
      if (value !== undefined) return;
      const el = nativeRef.current;
      if (el?.value) setInternal(el.value);
    }, [value, options.length]);

    React.useLayoutEffect(() => {
      if (!open) {
        setQuery("");
        return;
      }
      updateCoords();
      const selectedIdx = Math.max(
        0,
        filtered.findIndex((option) => option.value === selected)
      );
      setActiveIndex(selectedIdx);
      if (!showSearch) panelRef.current?.focus();
      const onWin = () => updateCoords();
      window.addEventListener("resize", onWin);
      window.addEventListener("scroll", onWin, true);
      return () => {
        window.removeEventListener("resize", onWin);
        window.removeEventListener("scroll", onWin, true);
      };
    }, [open, updateCoords, filtered, selected, showSearch]);

    React.useEffect(() => {
      if (!open) return;
      const onPointerDown = (event: MouseEvent) => {
        const target = event.target as Node;
        if (triggerRef.current?.contains(target) || panelRef.current?.contains(target)) return;
        setOpen(false);
        onBlur?.({
          target: nativeRef.current,
        } as React.FocusEvent<HTMLSelectElement>);
      };
      document.addEventListener("mousedown", onPointerDown);
      return () => document.removeEventListener("mousedown", onPointerDown);
    }, [open, onBlur]);

    const commit = (next: string) => {
      setInternal(next);
      setOpen(false);
      if (nativeRef.current) nativeRef.current.value = next;
      const event = {
        target: { value: next, name: name ?? "" },
        currentTarget: { value: next, name: name ?? "" },
      } as unknown as React.ChangeEvent<HTMLSelectElement>;
      onChange?.(event);
    };

    const onTriggerKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
      if (disabled) return;
      if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        setOpen(true);
      }
    };

    const onPanelKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
        return;
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((index) => Math.min(filtered.length - 1, index + 1));
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((index) => Math.max(0, index - 1));
        return;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        const option = filtered[activeIndex];
        if (option && !option.disabled) commit(option.value);
      }
    };

    const isPlaceholder = !selectedOption || selectedOption.value === "";
    const label = selectedOption?.label || placeholder || "Select";

    return (
      <div className={cn("relative", className)}>
        <select
          {...props}
          ref={setNativeRef}
          id={id}
          name={name}
          required={required}
          disabled={disabled}
          defaultValue={defaultValue !== undefined ? String(defaultValue) : undefined}
          className="sr-only"
          tabIndex={-1}
          aria-hidden
        >
          {children}
        </select>

        <button
          ref={triggerRef}
          type="button"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => {
            if (disabled) return;
            if (!open) {
              const rect = triggerRef.current?.getBoundingClientRect();
              if (rect) {
                setCoords({
                  top: rect.bottom,
                  left: rect.left,
                  width: Math.max(rect.width, 180),
                  openUp: false,
                });
              }
            }
            setOpen((current) => !current);
          }}
          onKeyDown={onTriggerKeyDown}
          className={cn(
            "flex h-10 w-full items-center justify-between gap-2 rounded-xl border bg-white/90 dark:bg-gray-50 px-3 text-sm shadow-sm transition-all cursor-pointer",
            "border-gray-200 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-red-500 focus:ring-red-500",
            open && "ring-2 ring-blue-600 border-transparent"
          )}
        >
          <span className={cn("truncate text-left", isPlaceholder && "text-gray-400")}>
            {label}
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200",
              open && "rotate-180 text-blue-600"
            )}
          />
        </button>

        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}

        {open &&
          createPortal(
            <div
              ref={panelRef}
              role="listbox"
              tabIndex={-1}
              onKeyDown={onPanelKeyDown}
              style={{
                position: "fixed",
                top: coords.openUp ? undefined : coords.top + 6,
                bottom: coords.openUp ? window.innerHeight - coords.top + 6 : undefined,
                left: coords.left,
                width: coords.width,
                zIndex: 90,
              }}
              className="rounded-xl border border-gray-200/80 bg-white dark:bg-gray-50 shadow-xl shadow-black/10 overflow-hidden outline-none"
            >
              {showSearch && (
                <div className="p-2 border-b border-gray-100">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                    <input
                      autoFocus
                      value={query}
                      onChange={(event) => {
                        setQuery(event.target.value);
                        setActiveIndex(0);
                      }}
                      placeholder="Search..."
                      className="h-8 w-full rounded-lg border border-gray-200 bg-gray-50 pl-8 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>
              )}
              <div className="max-h-72 overflow-y-auto p-1 sidebar-scroll">
                {filtered.length === 0 ? (
                  <p className="px-3 py-6 text-center text-sm text-gray-400">No results</p>
                ) : (
                  filtered.map((option, index) => {
                    const isSelected = option.value === selected;
                    const isActive = index === activeIndex;
                    return (
                      <button
                        key={`${option.value}-${index}`}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        disabled={option.disabled}
                        onMouseEnter={() => setActiveIndex(index)}
                        onClick={() => !option.disabled && commit(option.value)}
                        className={cn(
                          "flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors cursor-pointer",
                          isActive && "bg-gray-100 dark:bg-white/8",
                          isSelected && "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-200",
                          option.disabled && "opacity-40 cursor-not-allowed"
                        )}
                      >
                        <span className="truncate">{option.label}</span>
                        {isSelected && <Check className="h-3.5 w-3.5 shrink-0" />}
                      </button>
                    );
                  })
                )}
              </div>
            </div>,
            document.body
          )}
      </div>
    );
  }
);

Select.displayName = "Select";
