// GitHub Pages cannot issue an HTTP redirect for this project path.
// Keep the route, query, and fragment when opening the primary domain.
(function () {
  var sourcePath = "/OWASP-Hunting";
  var currentPath = window.location.pathname;

  if (
    window.location.hostname !== "owasp.github.io" ||
    (currentPath !== sourcePath && !currentPath.startsWith(sourcePath + "/"))
  ) {
    return;
  }

  var destination = new URL(
    currentPath.slice(sourcePath.length) || "/",
    "https://hunting.0d4y.dev/",
  );
  destination.search = window.location.search;
  destination.hash = window.location.hash;
  window.location.replace(destination.href);
})();
