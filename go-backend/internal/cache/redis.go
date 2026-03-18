package cache

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/redis/go-redis/v9"
)

// RedisClient — global Redis ulanish
type RedisClient struct {
	Client *redis.Client
}

// RedisConfig — Redis sozlamalari
type RedisConfig struct {
	Host     string
	Port     string
	Password string
	DB       int
}

// NewRedisClient — yangi Redis client yaratish
func NewRedisClient(cfg *RedisConfig) (*RedisClient, error) {
	client := redis.NewClient(&redis.Options{
		Addr:         fmt.Sprintf("%s:%s", cfg.Host, cfg.Port),
		Password:     cfg.Password,
		DB:           cfg.DB,
		DialTimeout:  5 * time.Second,
		ReadTimeout:  3 * time.Second,
		WriteTimeout: 3 * time.Second,
		PoolSize:     20,
		MinIdleConns: 5,
	})

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := client.Ping(ctx).Err(); err != nil {
		return nil, fmt.Errorf("redis ulanishda xatolik: %w", err)
	}

	log.Println("Redis connected successfully")
	return &RedisClient{Client: client}, nil
}

// Ping — Redis ishlayotganini tekshirish
func (r *RedisClient) Ping(ctx context.Context) error {
	return r.Client.Ping(ctx).Err()
}

// Close — Redis ulanishni yopish
func (r *RedisClient) Close() error {
	return r.Client.Close()
}

// Set — kalit-qiymat saqlash
func (r *RedisClient) Set(ctx context.Context, key string, value interface{}, ttl time.Duration) error {
	return r.Client.Set(ctx, key, value, ttl).Err()
}

// Get — kalit bo'yicha qiymat olish
func (r *RedisClient) Get(ctx context.Context, key string) (string, error) {
	return r.Client.Get(ctx, key).Result()
}

// Del — kalit o'chirish
func (r *RedisClient) Del(ctx context.Context, keys ...string) error {
	return r.Client.Del(ctx, keys...).Err()
}

// Exists — kalit borligini tekshirish
func (r *RedisClient) Exists(ctx context.Context, key string) (bool, error) {
	n, err := r.Client.Exists(ctx, key).Result()
	return n > 0, err
}

// Incr — hisoblagichni oshirish
func (r *RedisClient) Incr(ctx context.Context, key string) (int64, error) {
	return r.Client.Incr(ctx, key).Result()
}

// Expire — TTL o'rnatish
func (r *RedisClient) Expire(ctx context.Context, key string, ttl time.Duration) error {
	return r.Client.Expire(ctx, key, ttl).Err()
}

// TTL — qolgan vaqtni olish
func (r *RedisClient) TTL(ctx context.Context, key string) (time.Duration, error) {
	return r.Client.TTL(ctx, key).Result()
}

// FlushDB — joriy DB ni tozalash (faqat test uchun)
func (r *RedisClient) FlushDB(ctx context.Context) error {
	return r.Client.FlushDB(ctx).Err()
}

// Health — Redis holatini tekshirish
func (r *RedisClient) Health(ctx context.Context) map[string]interface{} {
	result := map[string]interface{}{
		"status": "unhealthy",
	}

	start := time.Now()
	err := r.Client.Ping(ctx).Err()
	latency := time.Since(start)

	if err != nil {
		result["error"] = err.Error()
		return result
	}

	result["status"] = "healthy"
	result["latency_ms"] = latency.Milliseconds()

	// Pool stats
	stats := r.Client.PoolStats()
	result["pool"] = map[string]interface{}{
		"total_conns": stats.TotalConns,
		"idle_conns":  stats.IdleConns,
		"stale_conns": stats.StaleConns,
	}

	return result
}
