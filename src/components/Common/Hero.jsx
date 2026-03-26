
import React from "react";
import { Box ,Typography} from "@mui/material";

const Hero = () => {
  return (
    <Box
          sx={{
            backgroundColor: "#53ba64",
            borderRadius: "24px",
            p: { xs: 3, md: 4 },
            mb: 4,
            color: "#fff",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            position: "relative",
            overflow: "hidden",
            minHeight: "220px",
            boxShadow: "0 10px 40px rgba(83, 186, 100, 0.2)"
          }}
        >
          <Box sx={{ position: "relative", zIndex: 1 }}>
            <Typography variant="h3" sx={{ fontWeight: "bold", mb: 1 }}>
              Welcome to Avnet, Abdullah!
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: "normal" }}>
              Your current readings are shown here
            </Typography>
          </Box>
          
          {/* Large semi-transparent "A" logo background decoration */}
          <Typography 
            sx={{ 
              position: "absolute", 
              right: -20, 
              bottom: -40, 
              fontSize: "250px", 
              fontWeight: "900", 
              color: "rgba(255,255,255,0.15)", 
              userSelect: "none",
              lineHeight: 1,
              zIndex: 0
            }}
          >
            A
          </Typography>
        </Box>
    
  );
};

export default Hero;
