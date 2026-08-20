from __future__ import annotations
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum


class RunStatus(str, Enum):
    queued = "queued"
    running = "running"
    completed = "completed"
    failed = "failed"


class ModelParameters(BaseModel):
    alpha: int = Field(3, ge=1, le=30)
    beta: int = Field(3, ge=1, le=30)
    num_vehicles: int = Field(2, ge=1, le=20)
    num_periods: int = Field(2, ge=1, le=10)
    num_product_types: int = Field(2, ge=1, le=10)
    num_modes: int = Field(3, ge=1, le=5)

    variable_cost_range: tuple[int, int] = (3, 15)
    fixed_cost_range: tuple[int, int] = (3, 15)
    travel_cost_range: tuple[int, int] = (5, 10)
    risk_range: tuple[float, float] = (0.0, 1.0)
    maintenance_cost_range: tuple[int, int] = (5, 10)
    access_cost_range: tuple[int, int] = (5, 10)

    vehicle_capacity_range: tuple[int, int] = (80, 150)
    customer_capacity_range: tuple[int, int] = (50, 100)
    product_weight_range: tuple[int, int] = (5, 10)

    solver: str = Field("cbc")
    time_limit_seconds: int = Field(300, ge=10, le=3600)
    objective_weights: tuple[float, float] = (0.5, 0.5)


class RunRequest(BaseModel):
    name: str
    parameters: ModelParameters


class RunSummary(BaseModel):
    id: str
    name: str
    status: RunStatus
    created_at: datetime
    finished_at: Optional[datetime] = None


class ObjectiveResult(BaseModel):
    cost: Optional[float] = None
    risk: Optional[float] = None


class RunResult(BaseModel):
    id: str
    status: RunStatus
    objectives: Optional[ObjectiveResult] = None
    routes: Optional[list[dict]] = None
    inventory_levels: Optional[list[dict]] = None
    solve_time_seconds: Optional[float] = None
    error_message: Optional[str] = None
    debug: Optional[dict] = None