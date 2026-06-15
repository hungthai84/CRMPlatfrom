import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

// Mocked structural analytics datasets
interface ConversionData {
  month: string;
  rate: number;
}

interface TicketData {
  month: string;
  created: number;
  resolved: number;
}

const conversionDataset: ConversionData[] = [
  { month: 'Jan', rate: 24 },
  { month: 'Feb', rate: 28 },
  { month: 'Mar', rate: 35 },
  { month: 'Apr', rate: 48 },
  { month: 'May', rate: 42 },
  { month: 'Jun', rate: 56 },
];

const ticketDataset: TicketData[] = [
  { month: 'Jan', created: 80, resolved: 65 },
  { month: 'Feb', created: 95, resolved: 85 },
  { month: 'Mar', created: 110, resolved: 105 },
  { month: 'Apr', created: 125, resolved: 110 },
  { month: 'May', created: 90, resolved: 88 },
  { month: 'Jun', created: 140, resolved: 135 },
];

export function D3AnalyticsChart() {
  const lineChartRef = useRef<SVGSVGElement | null>(null);
  const barChartRef = useRef<SVGSVGElement | null>(null);

  // Draw Line/Area Chart for Conversion Rates
  useEffect(() => {
    if (!lineChartRef.current) return;

    const svg = d3.select(lineChartRef.current);
    svg.selectAll('*').remove(); // Clean container

    const width = 450;
    const height = 240;
    const margin = { top: 25, right: 20, bottom: 35, left: 40 };

    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // X scale
    const x = d3.scalePoint()
      .domain(conversionDataset.map(d => d.month))
      .range([0, chartWidth]);

    // Y scale
    const y = d3.scaleLinear()
      .domain([0, 100])
      .range([chartHeight, 0]);

    // Add Gridlines
    g.append('g')
      .attr('class', 'grid')
      .attr('opacity', 0.1)
      .call(
        d3.axisLeft(y)
          .tickSize(-chartWidth)
          .tickFormat(() => '')
      );

    // X Axis
    g.append('g')
      .attr('transform', `translate(0, ${chartHeight})`)
      .call(d3.axisBottom(x).tickSize(0))
      .call(gAxis => {
        gAxis.select('.domain').remove(); // Remove background line
        gAxis.selectAll('text')
          .attr('fill', '#8c94a5')
          .attr('font-size', '10px')
          .attr('font-weight', '700')
          .attr('dy', '10px');
      });

    // Y Axis
    g.append('g')
      .call(d3.axisLeft(y).ticks(5).tickSize(0).tickFormat(d => `${d}%`))
      .call(gAxis => {
        gAxis.select('.domain').remove();
        gAxis.selectAll('text')
          .attr('fill', '#8c94a5')
          .attr('font-size', '10px')
          .attr('font-weight', '700')
          .attr('dx', '-4px');
      });

    // Define Shading Gradient
    const gradientId = 'd3-gradient-conversion';
    const defs = svg.append('defs');
    const linearGradient = defs.append('linearGradient')
      .attr('id', gradientId)
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    linearGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#2F69FF')
      .attr('stop-opacity', 0.4);

    linearGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#2F69FF')
      .attr('stop-opacity', 0.0);

    // Area generator
    const area = d3.area<ConversionData>()
      .x(d => x(d.month) || 0)
      .y0(chartHeight)
      .y1(d => y(d.rate))
      .curve(d3.curveMonotoneX);

    // Line generator
    const line = d3.line<ConversionData>()
      .x(d => x(d.month) || 0)
      .y(d => y(d.rate))
      .curve(d3.curveMonotoneX);

    // Append Area
    g.append('path')
      .datum(conversionDataset)
      .attr('fill', `url(#${gradientId})`)
      .attr('d', area);

    // Append Line path
    g.append('path')
      .datum(conversionDataset)
      .attr('fill', 'none')
      .attr('stroke', '#2F69FF')
      .attr('stroke-width', 3)
      .attr('d', line);

    // Interactive circles with tooltips
    const tooltip = d3.select('body').append('div')
      .attr('class', 'd3-tooltip')
      .style('position', 'absolute')
      .style('visibility', 'hidden')
      .style('background', 'rgba(15, 23, 42, 0.95)')
      .style('color', '#fff')
      .style('padding', '6px 10px')
      .style('border-radius', '8px')
      .style('font-size', '10px')
      .style('font-weight', '700')
      .style('box-shadow', '0 4px 12px rgba(0,0,0,0.15)')
      .style('pointer-events', 'none')
      .style('z-index', '9999');

    g.selectAll('circle')
      .data(conversionDataset)
      .enter()
      .append('circle')
      .attr('cx', d => x(d.month) || 0)
      .attr('cy', d => y(d.rate))
      .attr('r', 5)
      .attr('fill', '#ffffff')
      .attr('stroke', '#2F69FF')
      .attr('stroke-width', 2.5)
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d) {
        d3.select(this).transition().duration(100).attr('r', 7);
        tooltip.html(`Tỷ lệ chốt: <strong class="text-blue-300">${d.rate}%</strong>`)
          .style('visibility', 'visible');
      })
      .on('mousemove', function(event) {
        tooltip.style('top', (event.pageY - 35) + 'px')
          .style('left', (event.pageX + 10) + 'px');
      })
      .on('mouseout', function() {
        d3.select(this).transition().duration(100).attr('r', 5);
        tooltip.style('visibility', 'hidden');
      });

    // Cleanup tooltip on unmount
    return () => {
      tooltip.remove();
    };
  }, []);

  // Draw Grouped Bar Chart for Tickets
  useEffect(() => {
    if (!barChartRef.current) return;

    const svg = d3.select(barChartRef.current);
    svg.selectAll('*').remove();

    const width = 450;
    const height = 240;
    const margin = { top: 25, right: 20, bottom: 35, left: 40 };

    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // X0 scale (by month)
    const x0 = d3.scaleBand()
      .domain(ticketDataset.map(d => d.month))
      .rangeRound([0, chartWidth])
      .paddingInner(0.25);

    // X1 scale (created vs resolved)
    const keys = ['created', 'resolved'];
    const x1 = d3.scaleBand()
      .domain(keys)
      .rangeRound([0, x0.bandwidth()])
      .padding(0.05);

    // Y scale
    const y = d3.scaleLinear()
      .domain([0, 160])
      .range([chartHeight, 0]);

    // Color mapper
    const color = d3.scaleOrdinal<string>()
      .domain(keys)
      .range(['#6366F1', '#10B981']); // Indigo for Created, Emerald for Resolved

    // Add standard gridline overlay
    g.append('g')
      .attr('class', 'grid')
      .attr('opacity', 0.1)
      .call(
        d3.axisLeft(y)
          .tickSize(-chartWidth)
          .tickFormat(() => '')
      );

    // X Axis
    g.append('g')
      .attr('transform', `translate(0, ${chartHeight})`)
      .call(d3.axisBottom(x0).tickSize(0))
      .call(gAxis => {
        gAxis.select('.domain').remove();
        gAxis.selectAll('text')
          .attr('fill', '#8c94a5')
          .attr('font-size', '10px')
          .attr('font-weight', '700')
          .attr('dy', '10px');
      });

    // Y Axis
    g.append('g')
      .call(d3.axisLeft(y).ticks(5).tickSize(0))
      .call(gAxis => {
        gAxis.select('.domain').remove();
        gAxis.selectAll('text')
          .attr('fill', '#8c94a5')
          .attr('font-size', '10px')
          .attr('font-weight', '700')
          .attr('dx', '-4px');
      });

    // Tooltip
    const tooltip = d3.select('body').append('div')
      .attr('class', 'd3-tooltip-bar')
      .style('position', 'absolute')
      .style('visibility', 'hidden')
      .style('background', 'rgba(15, 23, 42, 0.95)')
      .style('color', '#fff')
      .style('padding', '6px 10px')
      .style('border-radius', '8px')
      .style('font-size', '10px')
      .style('font-weight', '700')
      .style('box-shadow', '0 4px 12px rgba(0,0,0,0.15)')
      .style('pointer-events', 'none')
      .style('z-index', '9999');

    // Drawing Grouped Bars
    g.append('g')
      .selectAll('g')
      .data(ticketDataset)
      .enter()
      .append('g')
      .attr('transform', d => `translate(${x0(d.month)}, 0)`)
      .selectAll('rect')
      .data(d => keys.map(key => ({ key, value: d[key as keyof TicketData] as number, month: d.month })))
      .enter()
      .append('rect')
      .attr('x', d => x1(d.key) || 0)
      .attr('y', d => y(d.value))
      .attr('width', x1.bandwidth())
      .attr('height', d => chartHeight - y(d.value))
      .attr('fill', d => color(d.key))
      .attr('rx', 3) // Rounded top corners
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d) {
        d3.select(this).transition().duration(100).style('opacity', 0.85);
        const name = d.key === 'created' ? 'Đã nhận' : 'Đã giải quyết';
        const colorText = d.key === 'created' ? 'text-indigo-300' : 'text-emerald-300';
        tooltip.html(`${name}: <strong class="${colorText}">${d.value} ticket</strong>`)
          .style('visibility', 'visible');
      })
      .on('mousemove', function(event) {
        tooltip.style('top', (event.pageY - 35) + 'px')
          .style('left', (event.pageX + 10) + 'px');
      })
      .on('mouseout', function() {
        d3.select(this).transition().duration(100).style('opacity', 1);
        tooltip.style('visibility', 'hidden');
      });

    return () => {
      tooltip.remove();
    };
  }, []);

  return (
    <div className="bg-white rounded-[10px] border border-[#eceef3] shadow-[0_8px_30px_rgba(0,0,0,0.015)] p-6 mt-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 border-b border-slate-100 pb-4 mb-5">
        <div>
          <h3 className="text-base font-extrabold text-[#0e0e11] tracking-tight">D3.js Insights Engine</h3>
          <p className="text-slate-400 text-xs font-semibold">Tỷ lệ chuyển đổi Lead và hiệu năng giải quyết Support Tickets</p>
        </div>
        <div className="flex items-center gap-4 text-xs font-bold shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2F69FF]" />
            <span className="text-slate-600">Tỷ lệ chốt Lead (%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#6366F1]" />
            <span className="text-slate-600">Ticket mở</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
            <span className="text-slate-600">Ticket đóng</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Conversion Rate Card */}
        <div className="flex flex-col items-center">
          <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-widest mb-3 self-start">TỪNG THÁNG LEAD CONVERSION RATES</h4>
          <div className="w-full bg-slate-50/50 dark:bg-slate-900/10 border border-slate-100 rounded-2xl p-4 flex items-center justify-center">
            <svg ref={lineChartRef} viewBox="0 0 450 240" className="w-full h-auto" />
          </div>
        </div>

        {/* Support Tickets Resolution Card */}
        <div className="flex flex-col items-center">
          <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-widest mb-3 self-start">XU HƯỚNG GIẢI QUYẾT SUPPORT TICKETS</h4>
          <div className="w-full bg-slate-50/50 dark:bg-slate-900/10 border border-slate-100 rounded-2xl p-4 flex items-center justify-center">
            <svg ref={barChartRef} viewBox="0 0 450 240" className="w-full h-auto" />
          </div>
        </div>
      </div>
    </div>
  );
}
