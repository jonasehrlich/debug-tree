import { ActionButton } from "@/components/action-button";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { Copy } from "lucide-react";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("ActionButton", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const setup = (onClick: () => boolean | Promise<unknown>) => {
    return {
      ...render(
        <ActionButton
          tooltipContent="Copy"
          icon={<Copy data-testid="copy-icon" />}
          onClick={onClick}
        />,
      ),
    };
  };

  it("renders with tooltip and icon", () => {
    render(
      <ActionButton
        tooltipContent="Tooltip Info"
        icon={<Copy data-testid="copy-icon" />}
        onClick={() => true}
      />,
    );
    expect(screen.getByText("Tooltip Info")).toBeInTheDocument();
    expect(screen.getByTestId("copy-icon")).toBeInTheDocument();
  });

  it("shows check icon after successful click (sync)", () => {
    setup(() => true);
    act(() => {
      fireEvent.click(screen.getByRole("button"));
    });
    expect(screen.getByTestId("check-icon")).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByTestId("copy-icon")).toBeInTheDocument();
  });

  it("shows check icon after successful click (async)", async () => {
    setup(() => Promise.resolve(true));

    await act(async () => {
      fireEvent.click(screen.getByRole("button"));
      await vi.runAllTimersAsync();
    });
    expect(screen.getByTestId("check-icon")).toBeInTheDocument();
    expect(screen.queryByTestId("copy-icon")).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByTestId("copy-icon")).toBeInTheDocument();
    expect(screen.queryByTestId("check-icon")).not.toBeInTheDocument();
  });

  it("does not show check icon unsuccessful click", () => {
    setup(() => false);
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByTestId("copy-icon")).toBeInTheDocument();
    expect(screen.queryByTestId("check-icon")).not.toBeInTheDocument();
  });

  it("shows icon again after rejected promise", async () => {
    setup(() => Promise.reject(Error("error")));
    fireEvent.click(screen.getByRole("button"));
    await act(async () => {
      await vi.runAllTimersAsync();
    });
    expect(screen.getByTestId("copy-icon")).toBeInTheDocument();
    expect(screen.queryByTestId("check-icon")).not.toBeInTheDocument();
  });

  it("renders text if provided", () => {
    render(
      <ActionButton
        tooltipContent="Copy"
        icon={<Copy data-testid="copy-icon" />}
        onClick={() => true}
        text="Copy Text"
      />,
    );
    act(() => {
      fireEvent.click(screen.getByRole("button"));
    });
    expect(screen.getByText("Copy Text")).toBeInTheDocument();
  });

  it("disables button when isSuccess is true", () => {
    setup(() => true);

    const button = screen.getByRole("button");
    act(() => {
      fireEvent.click(button);
    });
    expect(button).toBeDisabled();
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByTestId("copy-icon")).toBeInTheDocument();
    expect(screen.queryByTestId("check-icon")).not.toBeInTheDocument();
    expect(button).not.toBeDisabled();
  });
});
