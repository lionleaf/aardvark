#pragma once

#include "aardvark.capnp.h"

#define GLM_FORCE_RADIANS
#define GLM_FORCE_DEPTH_ZERO_TO_ONE
#include <glm/glm.hpp>
#include <glm/gtc/matrix_transform.hpp>

#include <vector>
#include <openvr.h>

namespace aardvark
{
	class CAardvarkClient;
}

class CCollisionTester
{
public:
	CCollisionTester( );

	void addGrabber( uint64_t globalGrabberId, const glm::mat4 & matGrabberFromUniverse, 
		AvVolume::Reader & volume, bool isPressed );
	void addGrabbableHandle( uint64_t globalGrabbableId, const glm::mat4 & matUniverseFromHandle, 
		AvVolume::Reader & volume );

	void addGrabber_Sphere( uint64_t globalGrabberId, const glm::mat4 & grabberFromUniverse,
		float radius, bool isPressed );
	void addGrabbableHandle_Sphere( uint64_t globalGrabbableId, const glm::mat4 & universeFromHandle,
		float radius );

	void addHook_Sphere( uint64_t globalHookId, const glm::mat4 & universeFromHook,
		float radius );

	void reset();
	void updateGrabberIntersections( aardvark::CAardvarkClient *client );

private:
	struct ActiveGrabber_t
	{
		uint64_t globalGrabberId;
		bool isPressed;
		glm::mat4 matGrabberFromUniverse;
		float radius;
	};
	std::vector<ActiveGrabber_t> m_activeGrabbers;

	struct Handle_t
	{
		glm::mat4 universeFromHandle;
		float radius;
	};

	struct ActiveGrabbable_t
	{
		uint64_t globalGrabbableId;
		std::vector<Handle_t> handles;
	};
	std::vector<ActiveGrabbable_t> m_activeGrabbables;

	struct ActiveHook_t
	{
		uint64_t globalHookId;
		glm::mat4 universeFromHook;
		float radius;
	};
	std::vector<ActiveHook_t> m_activeHooks;


};