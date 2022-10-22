map.addLayer({
    id: 'venue-slice-cones',
    type: 'custom',
    renderingMode: '3d',
    render: function (gl, matrix) {
      tb.update();
    }
  });


