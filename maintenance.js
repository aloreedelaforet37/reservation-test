const MAINTENANCE = true;

if (MAINTENANCE) {
  if (!window.location.pathname.includes("maintenance.html")) {
    window.location.replace("/reservation-test/maintenance.html");
  }
}
