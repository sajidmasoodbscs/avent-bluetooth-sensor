
import React from "react";
import { Box ,Typography} from "@mui/material";

const Hero = () => {
  return (
    <Box
          sx={{
            backgroundColor: "#53ba64",
            borderRadius: "6px",
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
            <Typography variant="h3" sx={{ fontWeight: "medium", mb: 1,fontSize:'26px' }}>
              Welcome to Avnet, Abdullah!
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: "normal",fontSize:'15px' }}>
              Your current readings are shown here
            </Typography>
          </Box>
          
          {/* Background decoration image */}
          <Box
            component="img"
            src="/heroimage.svg"
            sx={{ 
              position: "absolute", 
              right: 60, 
              top: -40, 
              width: "289px", 
              height: "230px",
              opacity: 0.8,
              userSelect: "none",
              zIndex: 0,
              filter: "brightness(0) invert(1)" // Ensure the image is white like the previous "A"
            }}
          />
        </Box>
    
  );
};

export default Hero;
