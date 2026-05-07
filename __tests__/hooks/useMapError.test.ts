import { renderHook, act } from "@testing-library/react";
import { useMapError } from "../../hooks/useMapError";

describe("useMapError Hook", () => {
  test("should initialize with no error", () => {
    const { result } = renderHook(() => useMapError());
    
    expect(result.current.error).toBeNull();
  });

  test("should set an error message", () => {
    const { result } = renderHook(() => useMapError());

    act(() => {
      result.current.setError("Test error message");
    });

    expect(result.current.error).toBe("Test error message");
  });

  test("should clear the error when clearError is called", () => {
    const { result } = renderHook(() => useMapError());

    act(() => {
      result.current.setError("Test error");
    });

    expect(result.current.error).toBe("Test error");

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  test("should overwrite previous error message when setError is called again", () => {
    const { result } = renderHook(() => useMapError());

    act(() => {
      result.current.setError("First error");
    });

    expect(result.current.error).toBe("First error");

    act(() => {
      result.current.setError("Second error");
    });

    expect(result.current.error).toBe("Second error");
  });

  test("should not break if clearError is called multiple times", () => {
    const { result } = renderHook(() => useMapError());

    act(() => {
      result.current.clearError();
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });
});
