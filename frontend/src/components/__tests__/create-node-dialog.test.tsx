import { CreateNodeDialog } from "@/components/create-node-dialog";
import { useStore } from "@/store";
import type { AppState } from "@/types/state";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, it, vi } from "vitest";

const addNodesMock = vi.fn();
const addEdgesMock = vi.fn();
const screenToFlowPositionMock = vi.fn();

vi.mock("@xyflow/react", () => {
  return {
    useReactFlow: () => ({
      addNodes: addNodesMock,
      addEdges: addEdgesMock,
      screenToFlowPosition: screenToFlowPositionMock,
    }),
  };
});

vi.mock("zustand/middleware", async () => {
  const actual =
    await vi.importActual<Record<string, unknown>>("zustand/middleware");
  return {
    ...actual,
    persist: (config: AppState) => config,
  };
});

describe("CreateNodeDialog", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
    act(() => {
      useStore.getState().reset();
    });
  });

  it("renders nothing if pendingNode is null", () => {
    render(<CreateNodeDialog />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders not closable dialog for statusNode with no nodes (root)", () => {
    const { container } = render(<CreateNodeDialog />);
    act(() => {
      useStore.getState().setPendingNodeData({
        type: "statusNode",
        eventScreenPosition: { x: 10, y: 20 },
        defaultRev: null,
      });
    });
    expect(screen.queryByRole("dialog")).toBeInTheDocument();
    expect(screen.queryByText(/Cancel/i)).not.toBeInTheDocument();
    expect(screen.queryByTestId("cancel-button")).not.toBeInTheDocument();
    act(() => {
      fireEvent.keyDown(container, { key: "Escape" });
    });
    expect(screen.queryByRole("dialog")).toBeInTheDocument();
  });

  it("renders closable dialog for action node with existing nodes ", () => {
    const { container } = render(<CreateNodeDialog />);
    act(() => {
      useStore.getState().nodes = [
        {
          id: "node-0",
          position: { x: 0, y: 0 },
          type: "statusNode",
          data: {
            title: "Test",
            description: "Desc",
            state: "unknown",
            git: null,
            isRootNode: true,
          },
        },
      ];
      useStore.getState().setPendingNodeData({
        type: "actionNode",
        eventScreenPosition: { x: 10, y: 20 },
        defaultRev: null,
      });
    });

    expect(screen.getAllByTestId("cancel-button").length).toBe(1);
    expect(screen.getByText(/Create a new node/i)).toBeInTheDocument();
    act(() => {
      fireEvent.keyDown(container, { key: "Escape" });
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(useStore.getState().dialogNodeData).toBeNull();
  });

  it("submits form and creates node w/o git revision", async () => {
    render(<CreateNodeDialog />);
    act(() => {
      useStore.getState().setPendingNodeData({
        type: "statusNode",
        eventScreenPosition: { x: 10, y: 20 },
        defaultRev: null,
      });
    });

    act(() => {
      fireEvent.change(screen.getByLabelText(/Title/i), {
        target: { value: "My Node Title" },
      });
      fireEvent.click(screen.getByText("Create"));
    });

    await waitFor(() => {
      expect(addNodesMock).toHaveBeenCalledTimes(1);
    });
    expect(useStore.getState().dialogNodeData).toBeNull();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("submits form and creates node", async () => {
    render(<CreateNodeDialog />);
    act(() => {
      useStore.getState().setPendingNodeData({
        type: "statusNode",
        eventScreenPosition: { x: 10, y: 20 },
        defaultRev: {
          rev: "12344567476",
          summary: "Main",
          type: "commit",
        },
      });
    });
    expect(screen.queryByRole("dialog")).toBeInTheDocument();

    act(() => {
      fireEvent.change(screen.getByLabelText(/Title/i), {
        target: { value: "My Node Title" },
      });
      fireEvent.click(screen.getByText("Create"));
    });
    await waitFor(() => {
      expect(addNodesMock).toHaveBeenCalledTimes(1);
    });

    expect(useStore.getState().dialogNodeData).toBeNull();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
