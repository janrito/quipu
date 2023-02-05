import "@testing-library/jest-dom";

import { render, fireEvent } from "@testing-library/svelte";
import BookmarkEditor from "./BookmarkEditor.svelte";

describe("BookmarkEditor", () => {
  it("should render BookmarkEditor", async () => {
    const props = {
      description: "This is a description",
      href: "http://bookmark.url",
      extended: "This is the extended description",
    };
    const { queryByRole, queryByText, component } = render(BookmarkEditor, { props });

    const descriptionDisplay = queryByRole("heading");
    expect(descriptionDisplay.textContent).toBe(props.description);

    const hrefDisplay = queryByText(props.href);
    expect(hrefDisplay).toBeInTheDocument();

    const extendedDescriptionDisplay = queryByText(props.extended);
    expect(extendedDescriptionDisplay).toBeInTheDocument();

    const mockDone = jest.fn();
    const mockDelete = jest.fn();
    let expectedDetails = {};
    const mockUpdate = jest.fn(event => {
      expectedDetails = { ...event.detail };
    });

    component.$on("done", mockDone);
    component.$on("delete", mockDelete);
    component.$on("update", mockUpdate);

    const deleteButton = queryByRole("button", { name: "delete" });
    expect(deleteButton).toBeInTheDocument();
    fireEvent.click(deleteButton);
    expect(mockDelete).toHaveBeenCalled();
    expect(mockDone.mock.calls).toHaveLength(1);

    const cancelButton = queryByRole("button", { name: "cancel" });
    expect(cancelButton).toBeInTheDocument();
    fireEvent.click(cancelButton);
    expect(mockDone.mock.calls).toHaveLength(2);

    const saveButton = queryByRole("button", { name: "save" });
    expect(saveButton).toBeInTheDocument();
    fireEvent.click(saveButton);
    expect(mockUpdate.mock.calls).toHaveLength(1);
    expect(expectedDetails).toStrictEqual({
      ...props,
      tags: [],
    });
    expect(mockDone.mock.calls).toHaveLength(3);
  });
});
