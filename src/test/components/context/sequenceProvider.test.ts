/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { GameActionSequenceContextProvider, useGameActionSequenceContext } from '@/features/game/context/GameActionSequenceContext';

describe.skip('GameActionSequenceContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with isBlocked as false', () => {
    const { result } = renderHook(() => useGameActionSequenceContext(), {
      wrapper: GameActionSequenceContextProvider,
    });

    expect(result.current.isBlocked).toBe(false);
  });

  it('should execute a single action and unblock after actionEnd is called', async () => {
    const { result } = renderHook(() => useGameActionSequenceContext(), {
      wrapper: GameActionSequenceContextProvider,
    });

    const mockAction = vi.fn(({ actionEnd }) => {
      setTimeout(actionEnd, 100);
    });

    act(() => {
      result.current.setAction(mockAction);
    });

    // Should be blocked while action is running
    await waitFor(() => {
      expect(result.current.isBlocked).toBe(true);
    });

    expect(mockAction).toHaveBeenCalledTimes(1);

    // Wait for action to complete
    await waitFor(() => {
      expect(result.current.isBlocked).toBe(false);
    }, { timeout: 200 });
  });

  it('should execute actions sequentially in queue order', async () => {
    const { result } = renderHook(() => useGameActionSequenceContext(), {
      wrapper: GameActionSequenceContextProvider,
    });

    const executionOrder: number[] = [];

    const action1 = vi.fn(({ actionEnd }) => {
      executionOrder.push(1);
      setTimeout(actionEnd, 50);
    });

    const action2 = vi.fn(({ actionEnd }) => {
      executionOrder.push(2);
      setTimeout(actionEnd, 50);
    });

    const action3 = vi.fn(({ actionEnd }) => {
      executionOrder.push(3);
      setTimeout(actionEnd, 50);
    });

    act(() => {
      result.current.setAction(action1);
      result.current.setAction(action2);
      result.current.setAction(action3);
    });

    // Wait for all actions to complete
    await waitFor(() => {
      expect(action1).toHaveBeenCalledTimes(1);
      expect(action2).toHaveBeenCalledTimes(1);
      expect(action3).toHaveBeenCalledTimes(1);
    }, { timeout: 300 });

    expect(executionOrder).toEqual([1, 2, 3]);
    
    // Wait for final unblock
    await waitFor(() => {
      expect(result.current.isBlocked).toBe(false);
    }, { timeout: 200 });
  });

  it('should not execute next action until actionEnd is called', async () => {
    const { result } = renderHook(() => useGameActionSequenceContext(), {
      wrapper: GameActionSequenceContextProvider,
    });

    let action1End: (() => void) | null = null;
    const action1 = vi.fn(({ actionEnd }) => {
      action1End = actionEnd;
    });

    const action2 = vi.fn(({ actionEnd }) => {
      setTimeout(actionEnd, 10);
    });

    act(() => {
      result.current.setAction(action1);
      result.current.setAction(action2);
    });

    await waitFor(() => {
      expect(result.current.isBlocked).toBe(true);
    });

    expect(action1).toHaveBeenCalledTimes(1);
    expect(action2).toHaveBeenCalledTimes(0);

    // Call actionEnd for first action
    act(() => {
      action1End!();
    });

    await waitFor(() => {
      expect(action2).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(result.current.isBlocked).toBe(false);
    }, { timeout: 100 });
  });

  it('should handle actions that call actionEnd immediately', async () => {
    const { result } = renderHook(() => useGameActionSequenceContext(), {
      wrapper: GameActionSequenceContextProvider,
    });

    const action1 = vi.fn(({ actionEnd }) => {
      actionEnd();
    });

    const action2 = vi.fn(({ actionEnd }) => {
      actionEnd();
    });

    act(() => {
      result.current.setAction(action1);
      result.current.setAction(action2);
    });

    await waitFor(() => {
      expect(action1).toHaveBeenCalledTimes(1);
      expect(action2).toHaveBeenCalledTimes(1);
    });

    expect(result.current.isBlocked).toBe(false);
  });

  it('should maintain blocked state during action execution', async () => {
    const { result } = renderHook(() => useGameActionSequenceContext(), {
      wrapper: GameActionSequenceContextProvider,
    });

    const action = vi.fn(({ actionEnd }) => {
      setTimeout(actionEnd, 100);
    });

    act(() => {
      result.current.setAction(action);
    });

    await waitFor(() => {
      expect(result.current.isBlocked).toBe(true);
    });

    // Should remain blocked during execution
    expect(result.current.isBlocked).toBe(true);

    await waitFor(() => {
      expect(result.current.isBlocked).toBe(false);
    }, { timeout: 200 });
  });
});
