import React from 'react';
import ReactDOMServer from 'react-dom/server';
import CaseDetailTooltip from '../app/components/case_detail/MapTooltip';
import { mapApi } from '../services/api';

export interface TooltipData {
  id: string;
}

const tooltipHtmlCache = new Map<string, string>();
const tooltipHtmlPromiseCache = new Map<string, Promise<string>>();

export async function getTooltip(data: TooltipData): Promise<string> {
  if (tooltipHtmlCache.has(data.id)) {
    return tooltipHtmlCache.get(data.id) || "";
  }

  const cachedPromise = tooltipHtmlPromiseCache.get(data.id);
  if (cachedPromise) {
    return await cachedPromise;
  }

  const requestPromise = (async () => {
    try {
      const caseDetail = await mapApi.getCaseDetail(data.id);
      const tooltipComponent = React.createElement(CaseDetailTooltip, {
        data: caseDetail,
        onClose: () => {
          console.log('Close requested for tooltip:', data.id);
        }
      });
      const html = ReactDOMServer.renderToString(tooltipComponent);
      tooltipHtmlCache.set(data.id, html);
      return html;
    } catch {
      return '<div class="bg-white p-4">Error loading data</div>';
    }
  })();

  tooltipHtmlPromiseCache.set(data.id, requestPromise);

  try {
    return await requestPromise;
  } finally {
    tooltipHtmlPromiseCache.delete(data.id);
  }
}
