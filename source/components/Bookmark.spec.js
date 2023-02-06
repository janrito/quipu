import "@testing-library/jest-dom";
import { fireEvent, render, within } from "@testing-library/svelte";

import Bookmark from "./Bookmark.svelte";

describe("Bookmark", () => {
  it("should render Bookmark", async () => {
    const props = {
      key: "key-1",
      title: "Title",
      url: "http://bookmark.url",
    };
    const { queryByRole, component } = render(Bookmark, { props });
    const title = queryByRole("heading");
    expect(title.textContent).toBe(props.title);
    const pilcrow = queryByRole("button", { name: "highlight" });
    expect(pilcrow).toBeInTheDocument();

    const mockHighlight = jest.fn();
    const mockOpen = jest.fn();
    const mockClose = jest.fn();

    component.$on("highlight", mockHighlight);
    component.$on("open", mockOpen);
    component.$on("close", mockClose);

    fireEvent.click(pilcrow);
    expect(mockHighlight).toHaveBeenCalled();

    fireEvent.click(title);
    expect(mockOpen).toHaveBeenCalled();

    fireEvent.mouseEnter(title);
    const closeButton = queryByRole("button", { name: "close" });
    expect(closeButton).toBeInTheDocument();

    fireEvent.click(closeButton);
    expect(mockClose).toHaveBeenCalled();

    const progressBar = queryByRole("progressbar");
    expect(progressBar).toHaveStyle("width: 0%");

    const tooltip = queryByRole("tooltip");
    expect(tooltip).not.toBeInTheDocument();
  });

  it("should render Bookmark with a favicon", async () => {
    const props = {
      key: "key-1",
      title: "Title",
      url: "http://bookmark.url",
      favIconUrl: "http://bookmark.url/favicon.ico",
    };
    const { queryByRole, component } = render(Bookmark, { props });
    const title = queryByRole("heading");
    expect(title.textContent).toBe(props.title);
    const favicon = queryByRole("button", { name: "highlight" });
    expect(favicon).toBeInTheDocument();
    expect(favicon).toHaveAttribute("src", props.favIconUrl);
    expect(favicon).toHaveAttribute("alt", props.title);

    const mockHighlight = jest.fn();
    const mockOpen = jest.fn();
    const mockClose = jest.fn();

    component.$on("highlight", mockHighlight);
    component.$on("open", mockOpen);
    component.$on("close", mockClose);

    fireEvent.click(favicon);
    expect(mockHighlight).toHaveBeenCalled();

    fireEvent.click(title);
    expect(mockOpen).toHaveBeenCalled();

    fireEvent.mouseEnter(title);
    const closeButton = queryByRole("button", { name: "close" });
    expect(closeButton).toBeInTheDocument();

    fireEvent.click(closeButton);
    expect(mockClose).toHaveBeenCalled();

    const progressBar = queryByRole("progressbar");
    expect(progressBar).toHaveStyle("width: 0%");

    const tooltip = queryByRole("tooltip");
    expect(tooltip).not.toBeInTheDocument();
  });

  it("should render Bookmark with a favicon and no title", async () => {
    const props = {
      key: "key-1",
      url: "http://bookmark.url/path",
      favIconUrl: "http://bookmark.url/favicon.ico",
    };
    const expectedDisplayTitle = "bookmark.url";

    const { queryByRole, component } = render(Bookmark, { props });
    const title = queryByRole("heading");
    expect(title.textContent).toBe(expectedDisplayTitle);
    const favicon = queryByRole("button", { name: "highlight" });
    expect(favicon).toBeInTheDocument();
    expect(favicon).toHaveAttribute("src", props.favIconUrl);
    expect(favicon).toHaveAttribute("alt", expectedDisplayTitle);

    const mockHighlight = jest.fn();
    const mockOpen = jest.fn();
    const mockClose = jest.fn();

    component.$on("highlight", mockHighlight);
    component.$on("open", mockOpen);
    component.$on("close", mockClose);

    fireEvent.click(favicon);
    expect(mockHighlight).toHaveBeenCalled();

    fireEvent.click(title);
    expect(mockOpen).toHaveBeenCalled();

    fireEvent.mouseEnter(title);
    const closeButton = queryByRole("button", { name: "close" });
    expect(closeButton).toBeInTheDocument();

    fireEvent.click(closeButton);
    expect(mockClose).toHaveBeenCalled();

    const progressBar = queryByRole("progressbar");
    expect(progressBar).toHaveStyle("width: 0%");

    const tooltip = queryByRole("tooltip");
    expect(tooltip).not.toBeInTheDocument();
  });

  it("should render Bookmark with close button disabled", async () => {
    const props = {
      key: "key-1",
      title: "Title",
      url: "http://bookmark.url",
      closeEnabled: false,
    };
    const { queryByRole, component } = render(Bookmark, { props });
    const title = queryByRole("heading");
    expect(title.textContent).toBe(props.title);
    const pilcrow = queryByRole("button", { name: "highlight" });
    expect(pilcrow).toBeInTheDocument();

    const mockHighlight = jest.fn();
    const mockOpen = jest.fn();
    const mockClose = jest.fn();

    component.$on("highlight", mockHighlight);
    component.$on("open", mockOpen);
    component.$on("close", mockClose);

    fireEvent.click(pilcrow);
    expect(mockHighlight).toHaveBeenCalled();

    fireEvent.mouseEnter(title);
    const closeButton = queryByRole("button", { name: "close" });
    expect(closeButton).not.toBeInTheDocument();

    const progressBar = queryByRole("progressbar");
    expect(progressBar).toHaveStyle("width: 0%");

    const tooltip = queryByRole("tooltip");
    expect(tooltip).not.toBeInTheDocument();
  });

  it("should render Bookmark with decay", async () => {
    const props = {
      key: "key-1",
      title: "Title",
      url: "http://bookmark.url",
      decay: 0.9,
    };
    const { queryByRole, component } = render(Bookmark, { props });
    const title = queryByRole("heading");
    expect(title.textContent).toBe(props.title);
    const pilcrow = queryByRole("button", { name: "highlight" });
    expect(pilcrow).toBeInTheDocument();

    const mockHighlight = jest.fn();
    const mockOpen = jest.fn();
    const mockClose = jest.fn();

    component.$on("highlight", mockHighlight);
    component.$on("open", mockOpen);
    component.$on("close", mockClose);

    fireEvent.click(pilcrow);
    expect(mockHighlight).toHaveBeenCalled();

    fireEvent.click(title);
    expect(mockOpen).toHaveBeenCalled();

    fireEvent.mouseEnter(title);
    const closeButton = queryByRole("button", { name: "close" });
    expect(closeButton).toBeInTheDocument();

    fireEvent.click(closeButton);
    expect(mockClose).toHaveBeenCalled();

    const progressBar = queryByRole("progressbar");
    expect(progressBar).toHaveStyle(`width: ${props.decay * 100}%`);

    const tooltip = queryByRole("tooltip");
    expect(tooltip).toBeInTheDocument();
    const tooltipLabel = within(tooltip).queryByText(`Decay: ${Math.round(props.decay * 100)}%`);
    expect(tooltipLabel).toBeInTheDocument();
  });
});
