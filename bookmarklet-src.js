(function () {
  const files = [
    ...new Set(
      [...document.querySelectorAll(".TimelineItem")]
        .filter((item) => {
          const isResolved = [...item.querySelectorAll(".Button-label")].filter((x) => x.innerText === "Unresolve conversation" || x.innerText === "Resolve conversation").length > 0;
          return isResolved;
        })
        .map((item) => {
          const path = item.querySelector("a").innerText;
          return path.indexOf("...") > -1 ? path.substring(path.indexOf("/") + 1) : path;
        })
    ),
  ];

  const url = `http://localhost:8123/files/${encodeURIComponent(JSON.stringify(files))}`;
  const newWindow = window.open(url, "_blank");
  setTimeout(() => newWindow && newWindow.close(), 1);
})();
