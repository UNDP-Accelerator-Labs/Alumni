const transitions = {
  "UN -> UN": 3,
  "NGO -> NGO": 4,
  "IFI -> Self-Employed": 1,
  "UN -> UNDP": 5, // Combined "UN -> UNDP" (4) + "UN -> UNDP  " (1)
  "Private Sector -> Private Sector": 9,
  "Government -> Academia": 2,
  "International Organization -> Private Sector": 2,
  "Academia -> UNDP": 2,
  "UN -> Self-Employed": 1,
  "UN -> N/A": 4,
  "NGO -> Government": 1,
  "Academia -> Academia": 3,
  "International Organization -> UNDP": 1,
  "UN -> NGO": 1,
  "NGO -> UNDP": 4,
  "UN -> Private Sector": 1,
  "Government -> N/A": 2,
  "UNDP -> Self-Employed": 2,
  "UNDP -> UNDP": 1,
  "NGO -> N/A": 5,
  "Private Sector -> UNDP": 8,
  "Academia -> Government": 2,
  "Government -> UNDP": 3,
  "Academia -> UN": 1,
  "UN -> Academia": 1,
  "UNDP -> Private Sector": 1,
  "NGO -> Private Sector": 1,
  "NGO -> Self-Employed": 1,
  "Private Sector -> N/A": 3,
  "Private Sector -> UN": 3,
  "UNDP -> IFI": 2,
  "NGO -> Academia": 2,
  "NGO -> IFI": 1,
  "Academia -> N/A": 2,
  "Government -> Private Sector": 1,
  "Academia -> Private Sector": 1,
  "UN -> International Organization": 1,
  "Government -> Government": 1,
  "Private Sector -> Government": 1,
  "UNDP -> UN": 1,
  "Academia -> NGO": 1,
  "International Organization -> UN": 1,
  "International Organization -> IFI": 1,
  "International Organization -> N/A": 1,
};

// Create unique sectors
const fromSectors = [
  "UN",
  "NGO",
  "IFI",
  "Private Sector",
  "Government",
  "International Organization",
  "Academia",
  "UNDP",
];
const toSectors = [
  "UN",
  "NGO",
  "Self-Employed",
  "UNDP",
  "Private Sector",
  "Academia",
  "N/A",
  "Government",
  "IFI",
  "International Organization",
];

// Create nodes
const nodes = [];
const nodeMap = new Map();

// Add source nodes
fromSectors.forEach((sector, i) => {
  const node = {
    id: i,
    name: sector + "\n(Before)",
    group: "source",
    originalName: sector,
  };
  nodes.push(node);
  nodeMap.set(sector + "_source", i);
});

// Add target nodes
toSectors.forEach((sector, i) => {
  const nodeId = fromSectors.length + i;
  const node = {
    id: nodeId,
    name: sector + "\n(After)",
    group: "target",
    originalName: sector,
  };
  nodes.push(node);
  nodeMap.set(sector + "_target", nodeId);
});

// Create links
const links = [];
Object.entries(transitions).forEach(([key, value]) => {
  const [from, to] = key.split(" -> ");
  const sourceId = nodeMap.get(from + "_source");
  const targetId = nodeMap.get(to + "_target");

  if (sourceId !== undefined && targetId !== undefined) {
    links.push({
      source: sourceId,
      target: targetId,
      value: value,
    });
  }
});

// Set up the SVG
const svg = d3.select("#sankeyChart");
const width = +svg.attr("width");
const height = +svg.attr("height");

// Create the Sankey generator
const sankey = d3
  .sankey()
  .nodeWidth(15)
  .nodePadding(10)
  .extent([
    [50, 50],
    [width - 50, height - 50],
  ]);

// Generate the Sankey layout
const { nodes: sankeyNodes, links: sankeyLinks } = sankey({
  nodes: nodes.map((d) => Object.assign({}, d)),
  links: links.map((d) => Object.assign({}, d)),
});

// Color scale for sectors
const colorScale = d3
  .scaleOrdinal()
  .domain(fromSectors.concat(toSectors))
  .range([
    "#006EB5",
    "#00AC4F",
    "#FFD100",
    "#EE402D",
    "#A21942",
    "#FF7E00",
    "#424242",
    "#757575",
    "#9E9E9E",
    "#BDBDBD",
  ]);

// Add links
svg
  .append("g")
  .selectAll("path")
  .data(sankeyLinks)
  .join("path")
  .attr("class", "link")
  .attr("d", d3.sankeyLinkHorizontal())
  .attr("stroke", (d) => colorScale(sankeyNodes[d.source.index].originalName))
  .attr("stroke-width", (d) => Math.max(1, d.width))
  .style("mix-blend-mode", "multiply")
  .on("mouseover", function (event, d) {
    d3.select(this).style("stroke-opacity", 0.8);

    const tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);

    tooltip
      .html(
        `${d.source.originalName} → ${d.target.originalName}<br>Candidates: ${d.value}`
      )
      .style("left", event.pageX + 10 + "px")
      .style("top", event.pageY - 10 + "px")
      .transition()
      .duration(200)
      .style("opacity", 1);
  })
  .on("mouseout", function () {
    d3.select(this).style("stroke-opacity", 0.5);
    d3.selectAll(".tooltip").remove();
  });

// Add nodes
const node = svg
  .append("g")
  .selectAll("g")
  .data(sankeyNodes)
  .join("g")
  .attr("class", "node");

node
  .append("rect")
  .attr("x", (d) => d.x0)
  .attr("y", (d) => d.y0)
  .attr("height", (d) => d.y1 - d.y0)
  .attr("width", (d) => d.x1 - d.x0)
  .attr("fill", (d) => colorScale(d.originalName))
  .attr("rx", 3)
  .attr("ry", 3);

// Add node labels
node
  .append("text")
  .attr("x", (d) => (d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6))
  .attr("y", (d) => (d.y1 + d.y0) / 2)
  .attr("dy", "0.35em")
  .attr("text-anchor", (d) => (d.x0 < width / 2 ? "start" : "end"))
  .text((d) => d.name)
  .style("font-size", "12px")
  .style("font-weight", "600")
  .style("fill", "#424242");

// Add value labels on larger nodes
node
  .append("text")
  .attr("x", (d) => (d.x0 + d.x1) / 2)
  .attr("y", (d) => (d.y1 + d.y0) / 2)
  .attr("dy", "0.35em")
  .attr("text-anchor", "middle")
  .text((d) => (d.value > 2 ? d.value : ""))
  .style("font-size", "11px")
  .style("font-weight", "bold")
  .style("fill", "white")
  .style("text-shadow", "1px 1px 2px rgba(0,0,0,0.5)");

// Add animation
svg
  .selectAll(".link")
  .style("opacity", 0)
  .transition()
  .duration(1500)
  .delay((d, i) => i * 50)
  .style("opacity", 1);

node
  .selectAll("rect")
  .style("opacity", 0)
  .transition()
  .duration(1000)
  .delay(800)
  .style("opacity", 1);

node
  .selectAll("text")
  .style("opacity", 0)
  .transition()
  .duration(1000)
  .delay(1200)
  .style("opacity", 1);
