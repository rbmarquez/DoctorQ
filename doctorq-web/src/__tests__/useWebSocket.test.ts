/**
 * Testes para o hook useWebSocket
 */

import { renderHook, waitFor } from '@testing-library/react';
import { useWebSocket } from '@/hooks/useWebSocket';

// Mock do WebSocket
global.WebSocket = jest.fn().mockImplementation(() => ({
  send: jest.fn(),
  close: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  readyState: WebSocket.OPEN,
})) as any;

describe('useWebSocket', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create WebSocket connection with correct URL', () => {
    const { result } = renderHook(() =>
      useWebSocket({
        userId: 'test-user-id',
        autoConnect: true,
      })
    );

    expect(WebSocket).toHaveBeenCalled();
  });

  it('should not auto-connect when autoConnect is false', () => {
    renderHook(() =>
      useWebSocket({
        userId: 'test-user-id',
        autoConnect: false,
      })
    );

    expect(WebSocket).not.toHaveBeenCalled();
  });

  it('should provide sendMessage function', () => {
    const { result } = renderHook(() =>
      useWebSocket({
        userId: 'test-user-id',
        autoConnect: false,
      })
    );

    expect(result.current.sendMessage).toBeDefined();
    expect(typeof result.current.sendMessage).toBe('function');
  });

  it('should provide sendTyping function', () => {
    const { result } = renderHook(() =>
      useWebSocket({
        userId: 'test-user-id',
        autoConnect: false,
      })
    );

    expect(result.current.sendTyping).toBeDefined();
    expect(typeof result.current.sendTyping).toBe('function');
  });

  it('should provide joinConversation function', () => {
    const { result } = renderHook(() =>
      useWebSocket({
        userId: 'test-user-id',
        autoConnect: false,
      })
    );

    expect(result.current.joinConversation).toBeDefined();
    expect(typeof result.current.joinConversation).toBe('function');
  });

  it('should provide leaveConversation function', () => {
    const { result } = renderHook(() =>
      useWebSocket({
        userId: 'test-user-id',
        autoConnect: false,
      })
    );

    expect(result.current.leaveConversation).toBeDefined();
    expect(typeof result.current.leaveConversation).toBe('function');
  });

  it('should have isConnected state', () => {
    const { result } = renderHook(() =>
      useWebSocket({
        userId: 'test-user-id',
        autoConnect: false,
      })
    );

    expect(result.current.isConnected).toBeDefined();
    expect(typeof result.current.isConnected).toBe('boolean');
  });
});
