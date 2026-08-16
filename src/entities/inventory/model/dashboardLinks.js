export function getRiskSalesPointInventoryUrl(point) {
  return point?.code ? `/inventory?salesPointCode=${encodeURIComponent(point.code)}` : '/inventory';
}

export function getUrgentSkuInventoryUrl(sku) {
  const salesPointCode =
    sku?.allocatedSalesPointCode ?? (sku?.stockLocationType === 'SALES_POINT' ? sku.stockLocationCode : null);

  if (sku?.code && salesPointCode) {
    const searchParams = new URLSearchParams({
      detailSkuCode: sku.code,
      detailSalesPointCode: salesPointCode,
    });

    return `/inventory?${searchParams.toString()}`;
  }

  return sku?.code ? `/inventory?q=${encodeURIComponent(sku.code)}` : '/inventory';
}
