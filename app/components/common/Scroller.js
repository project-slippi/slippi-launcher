import React from 'react';
import PropTypes from 'prop-types';

const Scroller = React.forwardRef((props, ref) => {
  const customStyles = {
    overflowY: 'auto',
    height: `calc(100vh - ${props.topOffset + 85}px)`,
    width: `calc(100% + 17px)`,
  };

  return <div ref={ref} style={customStyles}>{props.children}</div>;
});

Scroller.propTypes = {
  children: PropTypes.any.isRequired,
  topOffset: PropTypes.number.isRequired,
};

export default Scroller;
