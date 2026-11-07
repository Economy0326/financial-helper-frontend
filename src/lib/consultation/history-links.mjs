/** Use report identities for navigation; availability flags alone do not prove a stored report exists. */
export function getHistoryLinks(item) {
  if (!item || !item.consultationId) return [];
  const id = encodeURIComponent(item.consultationId);
  const links = [];
  if (item.reportId && item.actionReportAvailable !== false) {
    links.push({ kind: "ACTION", href: `/consultation/report?consultationId=${id}` });
  }
  if (item.informationReportId && item.informationReportAvailable !== false) {
    links.push({ kind: "INFORMATION", href: `/consultation/information?consultationId=${id}` });
  }
  return links;
}
