import React from 'react';
import { Box } from '@mui/material';

const TabSwitcher = ({ activeTab, onTabChange, tabs }) => {
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        gap: 0.5, 
        mb: 3, 
        backgroundColor: '#f5f5f5', 
        p: 0.5, 
        borderRadius: '6px',
      }}
    >
      {tabs.map((tab, index) => (
        <Box
          key={index}
          onClick={() => onTabChange(index)}
          sx={{
            flex: 1,
            py: { xs: 1, sm: 1.25 },
            textAlign: 'center',
            fontSize: { xs: '14px', sm: '15px' },
            fontWeight: 500,
            color: activeTab === index ? '#000' : '#666',
            backgroundColor: activeTab === index ? '#fff' : 'transparent',
            borderRadius: '5px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: activeTab === index ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
            '&:hover': {
              backgroundColor: activeTab === index ? '#fff' : 'rgba(255,255,255,0.5)',
            },
          }}
        >
          {tab.label}
        </Box>
      ))}
    </Box>
  );
};

export default TabSwitcher;

