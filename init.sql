-- UFOBeep Database Initialization Script
-- This script sets up the database with required extensions and initial configuration

-- Enable PostGIS extension for geospatial support
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- Set up timezone to UTC for consistent timestamps
SET timezone = 'UTC';

-- Create custom functions for geospatial calculations
-- Calculate distance between two points in kilometers
CREATE OR REPLACE FUNCTION calculate_distance(
    lat1 DOUBLE PRECISION,
    lon1 DOUBLE PRECISION,
    lat2 DOUBLE PRECISION,
    lon2 DOUBLE PRECISION
) RETURNS DOUBLE PRECISION
LANGUAGE SQL
IMMUTABLE
AS $$
    SELECT ST_Distance(
        ST_Point(lon1, lat1)::geography,
        ST_Point(lon2, lat2)::geography
    ) / 1000; -- Convert meters to kilometers
$$;

-- Function to find nearby points within a radius
CREATE OR REPLACE FUNCTION find_nearby_sightings(
    center_lat DOUBLE PRECISION,
    center_lon DOUBLE PRECISION,
    radius_km DOUBLE PRECISION
) RETURNS TABLE (
    id UUID,
    distance_km DOUBLE PRECISION
)
LANGUAGE SQL
STABLE
AS $$
    SELECT 
        s.id,
        calculate_distance(center_lat, center_lon, s.latitude, s.longitude) as distance_km
    FROM "Sighting" s
    WHERE s.latitude IS NOT NULL 
      AND s.longitude IS NOT NULL
      AND calculate_distance(center_lat, center_lon, s.latitude, s.longitude) <= radius_km
    ORDER BY distance_km;
$$;